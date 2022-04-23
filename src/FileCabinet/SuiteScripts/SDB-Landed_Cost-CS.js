/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 define(['N/search'], function (search) {
    function sublistChanged(context) {
      debugger;
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var op = context.operation;
            
            if (sublistName === 'custpage_sdb_transactions'){
                var lines = currentRecord.getLineCount("custpage_sdb_transactions")
                var totalMaritimo = 0;
                var totalCost = 0;
                 debugger
                for(var i=0;i<lines;i++){
                    var category = currentRecord.getSublistText({
                        sublistId: 'custpage_sdb_transactions',
                        fieldId: 'custpage_sdb_category',
                        line: i
                    })
                    if(category == 'Flete Maritimo'){
                        totalMaritimo+= Number(currentRecord.getSublistValue({
                            sublistId: 'custpage_sdb_transactions',
                            fieldId: 'custpage_sdb_amount',
                            line: i
                        }));
                    }else{
                        totalCost+= Number(currentRecord.getSublistValue({
                            sublistId: 'custpage_sdb_transactions',
                            fieldId: 'custpage_sdb_amount',
                            line: i
                        }));
                    }
                    
                }
               // document.getElementById("landedcostamount1_formattedValue").value = total
                if(totalMaritimo>0){
                    currentRecord.setValue({
                        fieldId: 'landedcostamount4',
                        value: totalMaritimo
                    })
                }else{
                    currentRecord.setValue({
                        fieldId: 'landedcostamount1',
                        value: totalCost
                    })
                }
                
            }
            
        }
    function fieldChanged(context) {
      try{
       
        var thisRecord = context.currentRecord;
        var option = thisRecord.getValue('landedcostsource1');
		var ammount = thisRecord.getValue('landedcostamount1');
        debugger;
        if (context.fieldId === 'custpage_sdb_vendor') {
           // debugger
           var selectedPo =  thisRecord.getCurrentSublistValue({
            sublistId: 'custpage_sdb_transactions',
            fieldId: 'custpage_sdb_vendor'
        });
        var total = search.lookupFields.promise({
            type: search.Type.VENDOR_BILL,
            id: selectedPo,
            columns : 'total'
            })
       .then(function (result) {
        thisRecord.setCurrentSublistValue({
            sublistId: 'custpage_sdb_transactions',
            fieldId: 'custpage_sdb_amount',
            value: result.total
        });
       
     })
       .catch(function onRejected(reason) {
            // do something on rejection
            });
      
          
        }else if(context.fieldId ==='landedcostamount1'  && ammount>0){
          // disabled this condition as this field will be disabled
          //&& option!= 'Manual' 
          
          debugger   
          var selectedValue = thisRecord.getValue('landedcostsourcetran1')||null;
            if(!selectedValue)return;
            var ammount = thisRecord.getValue('landedcostamount1');
            
            var lines = thisRecord.getLineCount("custpage_sdb_transactions")
            
            thisRecord.selectLine({
                sublistId: 'custpage_sdb_transactions',
                line: lines
            });
            thisRecord.setCurrentSublistValue({
                sublistId: 'custpage_sdb_transactions',
                fieldId: 'custpage_sdb_vendor',
                value: selectedValue
            });
            thisRecord.setCurrentSublistValue({
                sublistId: 'custpage_sdb_transactions',
                fieldId: 'custpage_sdb_amount',
                value: ammount
            });
            thisRecord.commitLine({
                sublistId: 'custpage_sdb_transactions'
            });
        
        }
         
      } catch(e){
        log.debug('error', e)
      }
    }

    return {
          fieldChanged: fieldChanged,
          sublistChanged: sublistChanged
    };

});

