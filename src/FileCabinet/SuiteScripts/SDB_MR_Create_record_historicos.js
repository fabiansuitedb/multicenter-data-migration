/**
 *@NApiVersion 2.0
 *@NScriptType mapreducescript
 *Factura de Compra
 */
 define([
    "N/record",
    "N/runtime",
    "N/log",
    "N/file",
    "N/search",
    'SuiteScripts/SDB_Lib_Creacion_historicos.js'
], function (record, runtime, log, file, search, lib) {


    return {

        getInputData: function (context) {
            var scriptObj = runtime.getCurrentScript();
            var fileId = scriptObj.getParameter({ name: 'custscript_csv_id' });
            try {

                // for(var index = 0; index < idfiles.length; index++) {
                var csvFile = file.load({
                    id:8016
                });
                var xmlFileContent = csvFile.getContents();
                var lines = xmlFileContent.replace(/[\r]/g, '').split("\n");
                var headers = lines[0].split(",");
                log.debug('headers.length', headers.length);
                var result = []
                for (var i = 1; i < lines.length; i++) {

                    var obj = {};
                    var currentline = lines[i].split(",");

                    for (var j = 0; j < headers.length; j++) {
                        var aux = '';
                        if (currentline[j] && typeof currentline[j] == "string") currentline[j] = currentline[j].replace(/["']/g, "");
                        obj[headers[j].replace(/[" "]/g, "").replace('/', '')] = currentline[j]//escape(currentline[j]); 
                    }
                    result.push(obj);
                }
                log.debug("result 0", result[0]);
                log.debug("result", result.length);

                    var fileObj = file.create({
                        name: 'historico-venta-2.json',
                        fileType: file.Type.PLAINTEXT,
                        contents: JSON.stringify(result)
                    });

                    fileObj.folder = 445;
                    var id = fileObj.save();
                //     var txtFile = file.load({
                //         id: id
                //     });
                //     var txtFileContent = txtFile.getContents();
                //     // if(txtFileContent)result=txtFileContent.replace(/--/g,',').replace(/---/g,'-')

            } catch (e) {
                log.error("error in reading lines of csv", JSON.stringify(e));
            }
            // log.debug("txtFileContent", txtFileContent);
            // return JSON.parse(txtFileContent);

             return result
        },

        map: function (context) {
            try {
                var details = context.value;
                log.error({ title: ' context.value', details: context.value });
                if (details) details = JSON.parse(details);
                log.error({ title: ' details', details: details });



                // var subsidiaria=lib.getSubsidiary(details["Subsidiaria"]);
                // var ubicacion=lib.getUbicacion(details["Ubicacion"]);
                // var cliente=lib.getCustomer(details["CodigodeclienteAntiguoERP"]);
                // var vendedor=lib.searchEmplyee(details["Vendedor"]);
                var moneda=lib.currencyval(details["Moneda"]);
                // var cuenta=lib.searchAccount(details["Cuenta"]);
                // var departamento=lib.getDepartamento('Administración General : Finanzas y Contabilidad');
                var proveedor=lib.getProveedor(details["CodigoproveedorantiguoERP"]);
                var empleado=lib.searchEmplyee(details["CodigoempleadoantiguoERP"]);


                var obj = {
                    OrdendeCompra: details["OrdendeCompra"],
                    Fecha: details["Fecha"],
                    Proveedor: proveedor,
                    CodigoproveedorantiguoERP: details["CodigoproveedorantiguoERP"],
                    Telefono: details["Telefono"],
                    Direccion: details["Direccion"],
                    Responsable: empleado,
                    CodigoempleadoantiguoERP: details["CodigoempleadoantiguoERP"],
                    Moneda: moneda,
                    Entrega: details["Entrega"],
                    Comentario: details["Comentario"],
                    Comentariocontable: details["Comentariocontable"],
                    Ubicacion: details["Ubicacion"],
                    Tipodecambio: details["Tipodecambio"],
                    Subtotal: details["Subtotal"],
                    Impuesto: details["Impuesto"],
                    Descuento: details["Descuento"],
                    Total: details["Total"],
                    Tipodecompra: details["Tipodecompra"],
                    Plazo: details["Plazo"],
                    Mn: details["MN"],
                    Me: details["ME"]

                }
                 log.error({ title: ' obj', details: obj });

            } catch (e) {
                log.error('Failed to create record', e.message);
                log.error('Failed details', details);
            }
            
            context.write({
                key: context.key,
                value: JSON.stringify(obj)
            });

        },

        reduce: function (context) {
            try {
                
                log.audit({ title: ' reduce values', details: context.values[0] });
                var objreduce = JSON.parse(context.values[0]);
                log.audit({ title: ' reduce values', details: objreduce });

                if (objreduce && (objreduce.OrdendeCompra == '5' || objreduce.OrdendeCompra == '1')) {
                    var hstorico_id = lib.createHistOrdenCompra(objreduce);
                    log.error({
                        title: 'ids',
                        details: hstorico_id
                    })
                }

            } catch (e) {
                log.debug({
                    title: 'ERROR reduce',
                    details: 'ERROR ' + JSON.stringify(e)
                })
            }
        },

        summarize: function (context) {
            try {
                log.debug({ title: 'context summarize', details: context });
                context.output.iterator().each(function (key, value) {
                    return true;
                });
            } catch (e) {
                log.error({
                    title: 'summarize',
                    details: 'ERROR ' + JSON.stringify(e)
                })
            }
        }
    }


});