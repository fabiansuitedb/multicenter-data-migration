/**
 *@NApiVersion 2.0
 *@NScriptType mapreducescript
 
 */
define([
    "N/record",
    "N/runtime",
    "N/log",
    "N/file",
    "N/search",
], function (record, runtime, log, file, search) {


    return {

        getInputData: function (context) {
            var scriptObj = runtime.getCurrentScript();
            var fileId = scriptObj.getParameter({ name: 'custscript_csv_id' });
            try {

                // for(var index = 0; index < idfiles.length; index++) {
                var csvFile = file.load({
                    id: 3287
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
                        obj[headers[j].replace(/[" "]/g, "").replace('/', '')] = currentline[j]//escape(currentline[j]);
                    }
                    result.push(obj);
                }
                log.debug("result 0", result[0]);
                log.debug("result", result.length);

                var fileObj = file.create({
                    name: 'AccountsDatatesttt-2.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: JSON.stringify(result)
                });

                fileObj.folder = -15;
                var id = fileObj.save();
                var txtFile = file.load({
                    id: 3388
                });
                var txtFileContent = txtFile.getContents();
                // if(txtFileContent)result=txtFileContent.replace(/--/g,',').replace(/---/g,'-')

            } catch (e) {
                log.error("error in reading lines of csv", JSON.stringify(e));
            }
            return JSON.parse(txtFileContent);
        },

        map: function (context) {
            try {
                var details = context.value;
                log.error('details', details);
                if (details) details = JSON.parse(details);
                log.error('etails["DEBE"]', details["DEBE"]);
                log.error('details["NOMBRE"]', details["NOMBRE"]);



                var debit = details["DEBE"];
                var credito = details['HABERCREDITO'];
                log.debug({ title: ' accountId', details: accountId });
                var accountId = searchAccount(details["NOMBRE"])
                log.debug({ title: ' debit', details: debit });
                log.audit({ title: ' credito', details: credito });



                if (debit == '1') {
                    log.audit("debit if", debit);
                    var account = record.submitFields({
                        type: record.Type.ACCOUNT,
                        id: accountId,
                        values: {
                            'custrecord_sdb_debit_for_ufv': true
                        }

                    })
                } else {
                    log.audit("credito if", credito);
                    var account = record.submitFields({
                        type: record.Type.ACCOUNT,
                        id: accountId,
                        values: {
                            'custrecord_sdv_credit_for_ufv': true
                        }

                    })
                }

            } catch (e) {
                log.error('Failed to create record', e.message);
                log.error('Failed details', details);
            }
            context.write({
                key: context.key,
                value: context.value
            });

        },

        // reduce: function (context) {
        //     try {
        //         log.debug({ title: ' reduce key', details: context.key });
        //         //  log.debug({ title: ' reduce values', details: JSON.parse(context.values[0]) });
        //         var objreduce = JSON.parse(context.values[0]);
        //         log.debug({ title: ' reduce values', details: objreduce });

        //         var obj = {
        //             number: objreduce["Número(Requerido)"],
        //             name: objreduce["Nombre(Requerido)"],
        //             resumen: objreduce["CuentadeResumen"],
        //             displayname: objreduce["Nombreparamostrar(Requerido)"],
        //             nombredeSubcuentade: objreduce["NombredeSubcuentade(Opcional)"],
        //             numerodeSubcuentade: objreduce["NúmerodeSubcuentade(Opcional)"],
        //             description: objreduce["Descripción(Opcional)"],
        //             type: objreduce["Tipodecuenta(Requerido)"],
        //             currency: objreduce["Moneda"],
        //             subsidiary: objreduce["Subsidiaria(Requerido)-ID"],
        //             restringiralDepartamento: objreduce["RestringiralDepartamento(Opcional"],
        //             requierecrearprimerolosDepartamentos: objreduce["requierecrearprimerolosDepartamentos)"],
        //             estricciónaClase: objreduce["estricciónaClase(Opcional"],
        //             incChilds: objreduce["Incluirhijos"],
        //             confirm: objreduce["Confirm"]
        //         }



        //         //   log.debug({ title: ' obj', details: obj });
        //         var nameAccount = '';
        //         if (obj.nombredeSubcuentade && obj.number) {
        //             // nameAccount = obj.nombredeSubcuentade.split(' ');
        //             // log.debug({ title: ' split()', details: nameAccount });
        //             // var nameAccount2 = nameAccount.shift();
        //             // log.debug({ title: ' nameAccount2', details: nameAccount2 });
        //             // log.debug({ title: ' shift()', details: nameAccount });
        //             // nameAccount = nameAccount.join(' ');

        //             log.debug({ title: ' nameAccount', details: obj.nombredeSubcuentade });
        //             var existParent = searchAccount(obj.nombredeSubcuentade, obj.numerodeSubcuentade);
        //             log.debug({ title: ' existParent val', details: existParent });
        //             if (existParent) createAccount(obj, existParent);
        //         }

        //     } catch (e) {
        //         log.error({
        //             title: 'ERROR reduce',
        //             details: 'ERROR ' + JSON.stringify(e)
        //         })
        //         log.error({ title: ' reduce values', details: objreduce });
        //     }
        // },

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


    function searchAccount(name) {
        log.audit("type name", name);
        try {
            var accountSearchObj = search.create({
                type: "account",
                filters:
                    [
                        ["displayname", "is", name]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Nombre"
                        }),
                        search.createColumn({ name: "displayname", label: "Nombre para mostrar" }),
                        search.createColumn({ name: "type", label: "Tipo de cuenta" }),
                        search.createColumn({ name: "description", label: "Descripción" }),
                        search.createColumn({ name: "balance", label: "Saldo" }),
                        search.createColumn({ name: "custrecord_fam_account_showinfixedasset", label: "Mostrar en gestión de activos fijos" })
                    ]
            });
            var searchResultCount = accountSearchObj.runPaged().count;
            log.debug("accountSearchObj result count", searchResultCount);
            var id = '';

            accountSearchObj.run().each(function (result) {

                id = result.id;

                return true;
            });


        } catch (e) {
            log.error("accountSearchObj error", e);

        }
        log.audit("IDD", id);
        return id
    }

});