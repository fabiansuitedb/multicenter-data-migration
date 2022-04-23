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
                    id: 1185
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
                        if (currentline[j] && typeof currentline[j] == "string") currentline[j] = currentline[j].replace(/["']/g, "");
                        obj[headers[j].replace(/[" "]/g, "").replace('/', '')] = currentline[j]//escape(currentline[j]); 
                    }
                    result.push(obj);
                }
               // log.debug("result 0", result[0]);
                log.debug("result", result.length);

                var fileObj = file.create({
                    name: 'AccountsData.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: JSON.stringify(result)
                });

                fileObj.folder = -15;
                var id = fileObj.save();
                var txtFile = file.load({
                    id: 1540
                });
                var txtFileContent = txtFile.getContents();
                // if(txtFileContent)result=txtFileContent.replace(/--/g,',').replace(/---/g,'-')

            } catch (e) {
                log.error("error in reading lines of csv", JSON.stringify(e));
            }
            var arr = []
           // arr.push(JSON.parse(txtFileContent)[0])
            return JSON.parse(txtFileContent)
        },

        map: function (context) {
            try {
                var details = context.value;
                if (details) details = JSON.parse(details);


                var obj = {
                    number: details["Numero(Requerido)"],
                    name: details["Nombre(Requerido)"],
                    displayname: details["Nombreparamostrar"],
                    nombredeSubcuentade: details["Subcuentade(Opcional)"],
                    description: details["Descripcion(Opcional)"],
                    type: details["Tipodecuenta(Requerido)"],
                    currency: details["Moneda(Requerido)"],
                    subsidiary: details["Subsidiaria(Requerido)"],
                    resumen: details["Resumen"]
                }

                log.debug({ title: ' obj', details: obj });
                log.audit({ title: ' obj.nombredeSubcuentade', details: obj.nombredeSubcuentade });
                //if (!obj.nombredeSubcuentade && obj.number) createAccount(obj, null)
                if (obj.number) createAccount(obj, null)

            } catch (e) {
                log.error('Failed to create record', e.message);
                log.error('Failed details', details);
            }
            context.write({
                key: context.key,
                value: context.value
            });

        },

        reduce: function (context) {
            try {
                log.debug({ title: ' reduce key', details: context.key });
                //  log.debug({ title: ' reduce values', details: JSON.parse(context.values[0]) });
                var details = JSON.parse(context.values[0]);
                log.debug({ title: ' reduce values', details: details });
                return
                var obj = {
                    number: details["Numero(Requerido)"],
                    name: details["Nombre(Requerido)"],
                    displayname: details["Nombreparamostrar"],
                    nombredeSubcuentade: details["Subcuentade(Opcional)"],
                    description: details["Descripcion(Opcional)"],
                    type: details["Tipodecuenta(Requerido)"],
                    currency: details["Moneda(Requerido)"],
                    subsidiary: details["Subsidiaria(Requerido)"],
                    resumen: details["Resumen"]

                }


                if (obj.nombredeSubcuentade && obj.number) {

                    log.debug({ title: ' nameAccount', details: obj.nombredeSubcuentade });
                    var existParent = searchAccount(obj.nombredeSubcuentade);
                    log.debug({ title: ' existParent val', details: existParent });
                    if (existParent) createAccount(obj, existParent);
                }

            } catch (e) {
                log.error({
                    title: 'ERROR reduce',
                    details: 'ERROR ' + JSON.stringify(e)
                })
                log.error({ title: ' reduce values', details: objreduce });
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

    function createAccount(obj, parent) {

        try {
            var account = record.create({
                type: record.Type.ACCOUNT,
                isDynamic: true,
            });


            account.setValue({
                fieldId: 'acctnumber',
                value: obj.number,
                ignoreFieldChange: true
            });

            account.setValue({
                fieldId: 'acctname',
                value: obj.name,
                ignoreFieldChange: true
            });


            account.setValue({
                fieldId: 'description',
                value: obj.description,
                ignoreFieldChange: true
            });

            if (obj.resumen === "Sí") {

                account.setValue({
                    fieldId: 'isinactive',
                    value: true,
                    ignoreFieldChange: true
                });

                account.setValue({
                    fieldId: 'issummary',
                    value: true,
                    ignoreFieldChange: true
                });
            }

            var accountType = accountToSet(obj.type);

            // log.debug({ title: 'accountType', details: accountType });
            account.setValue({
                fieldId: 'accttype',
                value: accountType,
                ignoreFieldChange: true
            });

            if (parent) {
                account.setValue({
                    fieldId: 'parent',
                    value: parent,
                    ignoreFieldChange: true
                });

            } else if(!obj.nombredeSubcuentade){
                account.setValue({
                    fieldId: 'custrecord_sdb_is_parent',
                    value: true,
                    ignoreFieldChange: true
                });
            }

            //dejale la moneda solo a cajas, banco, y tarjetas de credito

            if (obj.type == "Banco" || obj.type == "Tarjeta de credito" || obj.name.indexOf('Cajas') != -1) {

                var currencyId = '';
                if (obj.currency) currencyId = currencyval(obj.currency)
                log.debug("acurrencyId", currencyId);

                account.setValue({
                    fieldId: 'currency',
                    value: currencyId,
                    ignoreFieldChange: true
                });
            }

            account.setValue({
                fieldId: 'subsidiary',
                value: obj.subsidiary,
                ignoreFieldChange: true
            });

            if (obj.subsidiary == "1") {
                account.setValue({
                    fieldId: 'includechildren',
                    value: true,
                    ignoreFieldChange: true
                });
            }
            account.setValue({
                fieldId: 'custrecord_sdb_creada_csv',
                value: true,
                ignoreFieldChange: true
            });

            var id = account.save({
                ignoreMandatoryFields: true
            })
            log.audit({ title: 'context acount', details: id });
        } catch (e) {
            log.error({ title: 'Error createAccount', details: e });
            log.error({ title: 'obj --- createAccount', details: obj });
            log.error({ title: 'Accont name', details: obj.number + '    ' + obj.name });
        }

    }

    function accountToSet(accountTxt) {

        try {
            var ret = '';
            var accountTypeEs = [{ "value": "Bank", "text": "Banco" }, { "value": "AcctRec", "text": "Cuentas por cobrar" }, { "value": "OthCurrAsset", "text": "Otros activos circulantes" }, { "value": "FixedAsset", "text": "Activo fijo" }, { "value": "OthAsset", "text": "Otro activo" }, { "value": "AcctPay", "text": "Cuentas por pagar" }, { "value": "CredCard", "text": "Tarjeta de crédito" }, { "value": "OthCurrLiab", "text": "Otros pasivos circulantes" }, { "value": "LongTermLiab", "text": "Pasivo a largo plazo" }, { "value": "Equity", "text": "Patrimonio" }, { "value": "Income", "text": "Ingresos" }, { "value": "COGS", "text": "Coste de los artículos vendidos" }, { "value": "Expense", "text": "Gasto" }, { "value": "OthIncome", "text": "Otros ingresos" }, { "value": "OthExpense", "text": "Otros gastos" }, { "value": "NonPosting", "text": "Sin contabilización" }, { "value": "DeferRevenue", "text": "Ingresos diferidos" }, { "value": "DeferExpense", "text": "Gasto diferido" }, { "value": "UnbilledRec", "text": "Cuenta por cobrar no facturada" }, { "value": "Stat", "text": "Estadístico" }]
            var accountTypeEs2 = [{ "value": "Bank", "text": "Banco" }, { "value": "AcctRec", "text": "Cuentas por cobrar" }, { "value": "OthCurrAsset", "text": "Otros activos circulantes" }, { "value": "FixedAsset", "text": "Activo fijo" }, { "value": "OthAsset", "text": "Otro activo" }, { "value": "AcctPay", "text": "Cuentas por pagar" }, { "value": "CredCard", "text": "Tarjeta de crédito" }, { "value": "OthCurrLiab", "text": "Otros pasivos circulantes" }, { "value": "LongTermLiab", "text": "Pasivo a largo plazo" }, { "value": "Equity", "text": "Patrimonio" }, { "value": "Income", "text": "Ingresos" }, { "value": "COGS", "text": "Costo de los articulos vendidos" }, { "value": "Expense", "text": "Gasto" }, { "value": "OthIncome", "text": "Otros ingresos" }, { "value": "OthExpense", "text": "Otros gastos" }, { "value": "DeferRevenue", "text": "Ingresos diferidos" }, { "value": "DeferExpense", "text": "Gasto diferido" }, { "value": "UnbilledRec", "text": "Cuenta por cobrar no facturada" }, { "value": "Stat", "text": "Estadístico" }]
            var accountTypeUs = [{ "value": "Bank", "text": "Bank" }, { "value": "AcctRec", "text": "Accounts Receivable" }, { "value": "OthCurrAsset", "text": "Other Current Asset" }, { "value": "FixedAsset", "text": "Fixed Asset" }, { "value": "OthAsset", "text": "Other Asset" }, { "value": "AcctPay", "text": "Accounts Payable" }, { "value": "CredCard", "text": "Credit Card" }, { "value": "OthCurrLiab", "text": "Other Current Liability" }, { "value": "LongTermLiab", "text": "Long Term Liability" }, { "value": "Equity", "text": "Equity" }, { "value": "Income", "text": "Income" }, { "value": "COGS", "text": "Cost of Goods Sold" }, { "value": "Expense", "text": "Expense" }, { "value": "OthIncome", "text": "Other Income" }, { "value": "OthExpense", "text": "Other Expense" }, { "value": "NonPosting", "text": "Non Posting" }, { "value": "DeferRevenue", "text": "Deferred Revenue" }, { "value": "DeferExpense", "text": "Deferred Expense" }, { "value": "UnbilledRec", "text": "Unbilled Receivable" }]

            var account = accountTypeEs2.filter(function (e) {
                return e.text.toUpperCase() == accountTxt.toUpperCase();
            });
            if (account[0]) return account[0].value;
        } catch (e) {
            log.error("accountToSet error", e);
        }
        log.error("accountToSet ret", ret)
        return ret
    }


    function currencyval(name) {
        try {
            var accountSearchObj = search.create({
                type: "currency",
                filters:
                    [
                        ["name", "is", name]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                    ]
            });
            var searchResultCount = accountSearchObj.runPaged().count;
            //  log.error("currencyresult count", searchResultCount);
            var id = '';
            if (searchResultCount > 0) {
                accountSearchObj.run().each(function (result) {
                    id = result.id;
                    return true;
                });
                return id
            }

        } catch (e) {
            log.error("accountSearchObj error", e);

        }
        return id


    }


    function searchAccount(name, number) {

        try {
            var accountSearchObj = search.create({
                type: "account",
                filters:
                    [
                        ["name", "is", name]//,
                        //  "OR",
                        // ["number", "is", number]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }), search.createColumn({
                            name: "formulatext",
                            formula: "{type}",
                            label: "type"
                        })

                    ]
            });
            var searchResultCount = accountSearchObj.runPaged().count;
            log.debug("accountSearchObj result count", searchResultCount);
            var id = '';
            if (searchResultCount > 0) {

                accountSearchObj.run().each(function (result) {

                    id = result.id;
                    log.audit("type account", result.getValue(result.columns[1]));
                    return true;
                });
                log.audit("accountSearchObj result count", name + '  id: ' + id);
                return id
            }

        } catch (e) {
            log.error("accountSearchObj error", e);

        }
        return false
    }

});