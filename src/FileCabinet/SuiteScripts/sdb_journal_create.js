/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet     
*/
 define(['N/record'],

    function(record) {

        function onRequest(ctx) {
            const journalRecord = record.create({
                type: "journalentry",
            });

            const value = 255;

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
                    value: 1442,
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

        return {
            onRequest: onRequest
        };
     }
);