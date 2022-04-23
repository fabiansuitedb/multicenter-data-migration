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
                id: 'customsearch_sdb_accounts_to_show_search'
            });
            return mySearch;
        }

        function map(context) {

            var contextResult = JSON.parse(context.value);
            var subsidiaryArray = [2, 3, 6];
            var searchUfv = search.load({
                id: 'customsearch_sdb_calculo_diario'
            });
            var amountUfv = 0;
            var ufvArray = [];
            searchUfv.run().each(function (result) {
                amountUfv = result.getValue(result.columns[0]);
                ufvArray.push(amountUfv)
                return true;
            })

            var diff = (ufvArray[0] / ufvArray[1]);
            log.audit("diff: ", diff)
            // log.debug('map  contextResult)', contextResult.id);
            try {
                var mySearch = search.load({
                    id: 'customsearch_sdb_summary_calculation'
                });
                /*
                * Add a new filter to the existing filters array
                * */


                var defaultFilters = mySearch.filters;
                var custFilter2 = search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    join: 'account',
                    values: [contextResult.id]
                });
                //   var filter1 = defaultFilters[0];
                //defaultFilters[0] = custFilter2;
                defaultFilters.push(custFilter2);
                mySearch.filters = defaultFilters;
                var myResultSet = mySearch.run();
                var resultRange1 = myResultSet.getRange({
                    start: 0,
                    end: 5
                });
                var accountId = 0;
                var accountName = 0
                var date = '';
                var amount = 0;
                var subsidiary = 0;
                //  log.debug('map resultRange',resultRange);
               

                if (resultRange1 && resultRange1.length > 0) {

                    for (let y = 0; y < resultRange1.length; y++) {

                        accountId = resultRange1[y].getValue(resultRange1[y].columns[1]);
                        accountName = resultRange1[y].getText(resultRange1[y].columns[1]);
                        date = resultRange1[y].getValue(resultRange1[y].columns[0]);
                        amount = Number(resultRange1[y].getValue(resultRange1[y].columns[2]));
                        subsidiary = resultRange1[y].getValue(resultRange1[y].columns[3])
                        
                        // log.debug("subsidiaryArray: ", subsidiaryArray)
                        // log.debug("subsidiary: ", subsidiary)


                        var objRecord = record.create({
                            type: 'customrecord_sdb_ufv_calculo_reporte',
                            isDynamic: true
                        });

                        var ss = search.create({
                            type: 'customrecord_sdb_ufv_calculo_reporte',
                            filters: [
                                ["custrecord_sdb_cuenta", "is", contextResult.id],
                                "AND",
                                ["created", 'ONORAFTER', 'yesterday'],
                                //["created", 'ONORAFTER', 'twodaysago'],
                                "AND",
                                ["custrecord_sdb_subsidiaria_ufv", "is", subsidiary]
                            ],
                            columns: [
                                "custrecord_sdb_act_sin_movimi",
                                "custrecord_sdb_actualizacion_con_movimie",
                                "custrecord_sdb_total_ufv"
                            ]
                        });
                        var myResultSet = ss.run();

                        var resultRange = myResultSet.getRange({
                            start: 0,
                            end: 1
                        });
                        if (resultRange && resultRange.length > 0) {
                            var sin_movimiento = Number(resultRange[0].getValue("custrecord_sdb_act_sin_movimi")) || 0
                            var con_movimiento = Number(resultRange[0].getValue("custrecord_sdb_actualizacion_con_movimie")) || 0
                            var total = Number(resultRange[0].getValue("custrecord_sdb_total_ufv")) || 0
                            var index = subsidiaryArray.indexOf(subsidiary);
                            subsidiaryArray = subsidiaryArray.splice(index, 1);


                            
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_saldo_inicial_act_ant',
                                value: total 
                            })

                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_actualizacion_con_movimie',
                                value: total * diff
                            })

                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_cuenta',
                                value: contextResult.id
                            })
                            if (isNaN(amount) || amount == 0) {
                                objRecord.setValue({
                                    fieldId: 'custrecord_sdb_act_sin_movimi',
                                    value: sin_movimiento
                                })
                              
                                objRecord.setValue({
                                    fieldId: 'custrecord_sdb_transacciones_monto',
                                    value: 0
                                })

                                objRecord.setValue({
                                    fieldId: 'custrecord_sdb_total_ufv',
                                    value: total * diff
                                })
                            } else if (!isNaN(amount) && amount != 0) {

                                var newValue = (Number(amount) * diff) + Number(total * diff);
                                objRecord.setValue({
                                    fieldId: 'custrecord_sdb_transacciones_monto',
                                    value: amount
                                })

                                objRecord.setValue({
                                    fieldId: 'custrecord_sdb_act_sin_movimi',
                                    value: sin_movimiento + amount
                                })

                                objRecord.setValue({
                                    fieldId: 'custrecord_sdb_total_ufv',
                                    value: Number(newValue).toFixed(4)
                                })
                                //log.audit("custrecord_sdb_total_ufv: ", Number(newValue).toFixed(4))

                            }
                            log.audit("amount 111: ",  Number(amount))
                            log.audit("amount: 2222", diff)
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_transaction_actual',
                                value: Number(amount) * diff
                            })
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_subsidiaria_ufv',
                                value: subsidiary
                            })

                            var id = objRecord.save();
                        }

                    }//end for

                }
                if (subsidiaryArray && subsidiaryArray.length) {

                    for (var t = 0; t < subsidiaryArray.length; t++) {
                        var subsidiary = subsidiaryArray[t]
                        var objRecord = record.create({
                            type: 'customrecord_sdb_ufv_calculo_reporte',
                            isDynamic: true
                        });
                       
                        var ss = search.create({
                            type: 'customrecord_sdb_ufv_calculo_reporte',
                            filters: [
                                ["custrecord_sdb_cuenta", "is", contextResult.id],
                                "AND",
                                ["created", 'ONORAFTER', 'yesterday'],
                                //["created", 'ONORAFTER', 'twodaysago'],
                                "AND",
                                ["custrecord_sdb_subsidiaria_ufv", "is", subsidiary]
                            ],
                            columns: [
                                "custrecord_sdb_act_sin_movimi",
                                "custrecord_sdb_actualizacion_con_movimie",
                                "custrecord_sdb_total_ufv"
                            ]
                        });
                        var myResultSet = ss.run();

                        var resultRange = myResultSet.getRange({
                            start: 0,
                            end: 1
                        });

                       if(resultRange && resultRange.length){
                        var sin_movimiento = Number(resultRange[0].getValue("custrecord_sdb_act_sin_movimi")) || 0
                        var con_movimiento = Number(resultRange[0].getValue("custrecord_sdb_actualizacion_con_movimie")) || 0
                        var total = Number(resultRange[0].getValue("custrecord_sdb_total_ufv")) || 0
                        var newValue = (Number(amount) * diff) + Number(total * diff);
                        objRecord.setValue({
                            fieldId: 'custrecord_sdb_saldo_inicial_act_ant',
                            value: total 
                        })
                       
                       
                        log.debug("newValue: ", newValue)
                        log.debug("total: ", total)
                        objRecord.setValue({
                            fieldId: 'custrecord_sdb_actualizacion_con_movimie',
                            value: total * diff
                        })

                        objRecord.setValue({
                            fieldId: 'custrecord_sdb_cuenta',
                            value: contextResult.id
                        })
                        objRecord.setValue({
                            fieldId: 'custrecord_sdb_transacciones_monto',
                            value: amount
                        })

                        objRecord.setValue({
                            fieldId: 'custrecord_sdb_act_sin_movimi',
                            value: sin_movimiento + amount
                        })
                        objRecord.setValue({
                            fieldId: 'custrecord_sdb_subsidiaria_ufv',
                            value: subsidiary
                        })

                        objRecord.setValue({
                            fieldId: 'custrecord_sdb_total_ufv',
                            value: Number(newValue).toFixed(4)
                        })
                        log.audit("amount: ",  Number(amount))
                        log.audit("amount: ", diff)
                        objRecord.setValue({
                            fieldId: 'custrecord_sdb_transaction_actual',
                            value: Number(amount) * diff
                        })
                     
                        var id = objRecord.save();
                       }else{
                        var ss = search.create({
                            type: 'customrecord_sdb_ufv_calculo_reporte',
                            filters: [
                                ["custrecord_sdb_cuenta", "is", contextResult.id],
                                "AND",
                                ["created", 'ONORAFTER', 'yesterday']
                            ],
                            columns: [
                                "custrecord_sdb_act_sin_movimi",
                                "custrecord_sdb_actualizacion_con_movimie",
                                "custrecord_sdb_total_ufv"
                            ]
                        });
                        var myResultSet = ss.run();

                        var resultRange = myResultSet.getRange({
                            start: 0,
                            end: 1
                        });
                        if(resultRange && resultRange.length){
                            var sin_movimiento = Number(resultRange[0].getValue("custrecord_sdb_act_sin_movimi")) || 0
                            var con_movimiento = Number(resultRange[0].getValue("custrecord_sdb_actualizacion_con_movimie")) || 0
                            var total = Number(resultRange[0].getValue("custrecord_sdb_total_ufv")) || 0
                            var newValue = (Number(amount) * diff) + Number(total * diff);
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_saldo_inicial_act_ant',
                                value: total 
                            })
                           
                           
                            log.debug("newValue: ", newValue)
                            log.debug("total: ", total)
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_actualizacion_con_movimie',
                                value: total * diff
                            })
    
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_cuenta',
                                value: contextResult.id
                            })
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_transacciones_monto',
                                value: amount
                            })
    
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_act_sin_movimi',
                                value: sin_movimiento + amount
                            })
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_subsidiaria_ufv',
                                value: subsidiary
                            })
    
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_total_ufv',
                                value: Number(newValue).toFixed(4)
                            })
                            log.audit("amount: ",  Number(amount))
                            log.audit("amount: ", diff)
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_transaction_actual',
                                value: Number(amount) * diff
                            })
                         
                            var id = objRecord.save();
                        }else{
                            var sin_movimiento = 0
                            var con_movimiento = 0
                            var total = 0
                            var newValue = (Number(amount) * diff) + Number(total * diff);
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_saldo_inicial_act_ant',
                                value: total 
                            })
                           
                           
                            log.debug("newValue: ", newValue)
                            log.debug("total: ", total)
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_actualizacion_con_movimie',
                                value: total * diff
                            })
    
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_cuenta',
                                value: contextResult.id
                            })
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_transacciones_monto',
                                value: amount
                            })
    
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_act_sin_movimi',
                                value: sin_movimiento + amount
                            })
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_subsidiaria_ufv',
                                value: subsidiary
                            })
    
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_total_ufv',
                                value: Number(newValue).toFixed(4)
                            })
                            log.audit("amount: ",  Number(amount))
                            log.audit("amount: ", diff)
                            objRecord.setValue({
                                fieldId: 'custrecord_sdb_transaction_actual',
                                value: Number(amount) * diff
                            })
                         
                            var id = objRecord.save();
                        }
                       }
                       
                    }
                }
               // var newNumberJournal = round(newValue, 2);
                //  var createJournal = createJournalRecord(newNumberJournal, contextResult.id
            } catch (e) {
                log.debug('ERROR: ', e);
            }

        }
        function createJournalRecord(amount, account) {
            const journalRecord = record.create({
                type: "journalentry",
            });
            var value = amount;

            journalRecord.setValue("subsidiary", 1);
            journalRecord.setValue("currency", 2);
            for (let i = 0; i < 2; i++) {
                journalRecord.insertLine({
                    sublistId: "line",
                    line: i,
                })

                journalRecord.setSublistValue({
                    sublistId: "line",
                    fieldId: "account",
                    value: account,
                    line: i
                });
                journalRecord.setSublistValue({
                    sublistId: "line",
                    fieldId: i == 1 ? "debit" : "credit",
                    value: value,
                    line: i
                });


            }
            journalRecord.save()
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