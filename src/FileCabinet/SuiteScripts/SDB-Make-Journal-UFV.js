/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
/*
{"418":[{"itemId":"611","difference":1,"vendor":"418"}],"1121":[{"itemId":"609","difference":1,"vendor":"1121"},{"itemId":"610","difference":1,"vendor":"1121"}]}
 */
define(["N/log", "N/record", "N/search", "N/runtime"],
    function (log, record, search, runtime) {
        function getInputData() {

            var mySearch = search.load({
                id: 'customsearch_sdb_calculo_sumatoria_mes_j'
            });
            return mySearch;
        }

        function map(context) {
            var contextResult = JSON.parse(context.value);
            log.debug('map  contextResult)', contextResult);
            try {
                var subsidiary = contextResult.values["GROUP(custrecord_sdb_subsidiaria_ufv)"].value;
                var monto = Number(contextResult.values["SUM(formulanumeric)"]);
                var iscredit = contextResult.values["GROUP(custrecord_sdv_credit_for_ufv.CUSTRECORD_SDB_CUENTA)"] === "T"
                var account = contextResult.values["GROUP(custrecord_sdb_cuenta)"].value;
                var createJournal = createJournalRecord(monto, account, subsidiary,iscredit)

            } catch (e) {
                log.debug('ERROR: ', e);
            }

        }
        // las del debe son positivas y de ser contrario van al credit
        // Las del credit son negativas, y si vienen positivas van al debito
        //
        // Hacer la diferencia 6220100 (cuenta de ajuste UFV)

        function createJournalRecord(monto, account, subsidiary,iscredit) {
            const journalRecord = record.create({
                type: "journalentry",
               defaultValues: {
       		   bookje: 'T' // Setting bookje parameter to T makes the journal book specific.
               }
            });

            log.debug('monto in journal: ', monto);
            log.debug("iscredit: ",iscredit);

            journalRecord.setValue("subsidiary", subsidiary);
            journalRecord.setValue("currency", 1);
            journalRecord.setValue({
    		fieldId: 'accountingbook',
   			 value: 2                      // Setting a value for this field makes the record book-specific.
			});
          
            var setCredit = false;
            journalRecord.insertLine({
                sublistId: "line",
                line: 0,
            })

            journalRecord.setSublistValue({
                sublistId: "line",
                fieldId: "account",
                value: account,
                line: 0
            });
            if(iscredit && monto < 0){
                journalRecord.setSublistValue({
                    sublistId: "line",
                    fieldId: "credit",
                    value: monto,
                    line: 0
                });
                setCredit=true;
            }else if(iscredit && monto > 0){
                log.debug("entro: ",'entro en if');
                journalRecord.setSublistValue({
                    sublistId: "line",
                    fieldId: "debit",
                    value: monto,
                    line: 0
                });
            }else if(!iscredit && monto > 0){
                journalRecord.setSublistValue({
                    sublistId: "line",
                    fieldId: "debit",
                    value: monto,
                    line: 0
                });
            }else if(!iscredit && monto < 0){
                journalRecord.setSublistValue({
                    sublistId: "line",
                    fieldId: "credit",
                    value: monto,
                    line: 0
                });
                setCredit=true;
            }

            journalRecord.insertLine({
                sublistId: "line",
                line: 1,
            })

            if(setCredit){
                journalRecord.setSublistValue({
                    sublistId: "line",
                    fieldId: "account",
                    value: 1798,
                    line: 1
                });
                journalRecord.setSublistValue({
                    sublistId: "line",
                    fieldId: "debit",
                    value: monto,
                    line: 1
                });
                
            }else{
                journalRecord.setSublistValue({
                    sublistId: "line",
                    fieldId: "account",
                    value: 2163,
                    line: 1
                });
                journalRecord.setSublistValue({
                    sublistId: "line",
                    fieldId: "credit",
                    value: monto,
                    line: 1
                });
            }
            var idJournal = journalRecord.save();
            log.debug("idJournal: ",idJournal);
        }
        function round(value, precision) {
            var multiplier = Math.pow(10, precision || 0);
            return Math.round(value * multiplier) / multiplier;
        }

        function summarize(context) {


        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };


    });