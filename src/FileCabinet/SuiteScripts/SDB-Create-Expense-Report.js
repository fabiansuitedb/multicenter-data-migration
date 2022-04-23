/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */
define(["N/record", "N/runtime", "N/format", 'N/redirect'], function (record, runtime, format, redirect) {
    function ngAction(scriptContext) {

        try {
            var motivoPrestamo = runtime.getCurrentScript().getParameter({
                name: 'custscript_sdb_motivos_prestamo'
            });
            var newRecord = scriptContext.newRecord;
            var prestamoMaximo = newRecord.getValue({
                fieldId: 'custentity_sdb_limite_de_prestamo'
            });
            var cantidadDeCuotas = newRecord.getValue({
                fieldId: 'custentity_sdb_cuotas_prestamo'
            });
            var cantidadPorCuota = prestamoMaximo / cantidadDeCuotas
            var empleado = newRecord.getValue({
                fieldId: 'id'
            });
            var currency = newRecord.getValue({
                fieldId: 'currency'
            });

            var expenseReport = record.create({
                type: record.Type.EXPENSE_REPORT,
                isDynamic: true,
            });
            expenseReport.setValue({
                fieldId: 'entity',
                value: empleado
            });
            expenseReport.setValue({
                fieldId: 'expensereportcurrency',
                value: currency
            });


            var inicio_descuento = new Date()
            inicio_descuento.setMonth(inicio_descuento.getMonth())

            var parsedDateStringAsRawDateObject = format.parse({
                value: inicio_descuento,
                type: format.Type.DATE
            });

            expenseReport.setValue({
                fieldId: 'custbody_sdb_periodo_inicio_descuento',
                value: parsedDateStringAsRawDateObject
            });

            expenseReport.setValue({
                fieldId: 'custbody_sdb_motivo_prestamo',
                value: motivoPrestamo
            });


            for (var i = 0; i < cantidadDeCuotas; i++) {
                expenseReport.selectLine({
                    sublistId: 'expense',
                    line: i
                });

                var date = new Date();
                if (i != 0) date.setMonth(date.getMonth() + i)

                expenseReport.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'expensedate',
                    value: date,
                });

                expenseReport.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'category',
                    value: 1,
                });
                expenseReport.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'currency',
                    value: currency,
                });
                expenseReport.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'amount',
                    value: cantidadPorCuota,
                });
                expenseReport.commitLine({
                    sublistId: 'expense'
                });
            }
            var id = expenseReport.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            if(id){
                redirect.toRecord({
                    type: record.Type.EXPENSE_REPORT,
                    id: id
                });
            }
        } catch (e) {
            log.debug({
                title: 'error',
                details: e
            })
        }
    }
    return {
        onAction: ngAction
    }
});