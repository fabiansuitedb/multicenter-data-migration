/** 
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/

define(['N/record', 'N/log', 'N/ui/serverWidget'], function (record, log, serverWidget) {

    function beforeSubmit(context) {

        try {

            var newRecord = context.newRecord;
            var id = newRecord.id;
            var amount = 0;
            var lines = newRecord.getLineCount("custpage_sdb_transactions");
            var currentJson = [];
            for (var i = 0; i < lines; i++) {

                var currentValue = Number(newRecord.getSublistValue({
                    sublistId: 'custpage_sdb_transactions',
                    fieldId: 'custpage_sdb_amount',
                    line: i
                }));
                var transactionId = newRecord.getSublistValue({
                    sublistId: 'custpage_sdb_transactions',
                    fieldId: 'custpage_sdb_vendor',
                    line: i
                })
                var costCategory = newRecord.getSublistValue({
                    sublistId: 'custpage_sdb_transactions',
                    fieldId: 'custpage_sdb_category',
                    line: i
                })
                amount += currentValue;
                currentJson.push({
                    amount: currentValue,
                    transactionId: transactionId,
                    costCategory:costCategory
                })
            }

            // newRecord.setValue({
            //     fieldId: 'landedcostamount1',
            //     value: amount
            // })
            newRecord.setValue({
                fieldId: 'custbody_sdb_json_landed_cost',
                value: JSON.stringify(currentJson)
            })


        } catch (e) {
            log.debug('Error', e.toString());
        }

    }

    function beforeLoad(context) {

        try {
           log.debug('context ', context.UserEventType.VIEW);
            var form = context.form;
         
            var newRecord = context.newRecord;
            var landedcostsource1 = form.getField({
                id: 'landedcostsource1'
            })
            landedcostsource1.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
          var landedcostsource4 = form.getField({
                id: 'landedcostsource4'
            })
            landedcostsource4.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
          
            var sublist = form.addSublist({
                id: 'custpage_sdb_transactions'
                , label: 'Landed Cost'
                , type: 'INLINEEDITOR'
                , title: 'Landed Cost'
                , tab: 'landedcost'
            });
            var field = form.getField({
                id: 'landedcostamount1'
            });

            var bill_list = sublist.addField({ id: 'custpage_sdb_vendor', type: 'SELECT', source: "vendorbill", label: 'Transaccion Seleccionada' });

            var cost_category = sublist.addField({ id: 'custpage_sdb_category', type: 'SELECT', source: "customrecord_sdb_landed_cost", label: 'Cateogria de Costo' });
           
            var amount = sublist.addField({ id: 'custpage_sdb_amount', type: 'text', label: 'Costo' });
            
          

            var currentJson = newRecord.getValue('custbody_sdb_json_landed_cost');
            if (currentJson) {
             	 var field = form.getField({
    				id : 'landedcostsourcetran1'
				});
            //  if(context.type === context.UserEventType.VIEW){
				 field.updateDisplayType({
             	   displayType: serverWidget.FieldDisplayType.HIDDEN
           		 });
              //}
              
                currentJson = JSON.parse(currentJson);
                for (let index = 0; index < currentJson.length; index++) {
                     log.debug('currentJson transactionId: ', currentJson[index].transactionId);
                     sublist.setSublistValue({
                        id: 'custpage_sdb_vendor',
                        line:index,
                        value: currentJson[index].transactionId
                    });
                    sublist.setSublistValue({
                        id: 'custpage_sdb_amount',
         				line:index,
                        value: currentJson[index].amount
                    });
                    sublist.setSublistValue({
                        id: 'custpage_sdb_category',
         				line:index,
                        value: currentJson[index].costCategory
                    });

                   /* newRecord.commitLine({
                        sublistId: 'custpage_sdb_transactions'
                    });*/
                }
            }
            // methodList.addSelectOption({
            //     value: '',
            //     text: '--SELECT--'
            // });


        } catch (e) {
            log.audit('error', e);
        }
    }
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };

});