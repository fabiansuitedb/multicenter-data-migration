/**
 * - PlugIn Implementation -
 */
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    try {
        if (standardLines.getCount() == 0) return;
        var rcd = nlapiLoadRecord('customrecord_sdb_config_expensas', 1)
        var defRevenueAcc = rcd.getFieldValue('custrecord_sdb_cuenta_expensas'); //Credito
        var defRevenueAcc2 = rcd.getFieldValue('custrecord_sdb_cuenta_expensas2'); // Debito

        var amount = nlapiGetLineItemValue('expense', 'amount', 1);
        for (var i = 0; i < standardLines.getCount(); i++) {
            var currLine = standardLines.getLine(i);
            if (parseFloat(standardLines.getLine(i).getDebitAmount()) > 0) {
                var debitAmount = parseFloat(standardLines.getLine(i).getDebitAmount());
                var newLine = customLines.addNewLine();
                newLine.setDebitAmount(debitAmount);
                newLine.setAccountId(parseInt(defRevenueAcc2));
            }
              else if (parseFloat(standardLines.getLine(i).getCreditAmount()) > 0) {
                var creditAmount = parseFloat(standardLines.getLine(i).getCreditAmount());
                var newLine = customLines.addNewLine();
                newLine.setCreditAmount(creditAmount);
                newLine.setAccountId(parseInt(defRevenueAcc));
            }
        }
    } catch (e) {
        nlapiLogExecution("DEBUG", "ERROR", e);
    }
}