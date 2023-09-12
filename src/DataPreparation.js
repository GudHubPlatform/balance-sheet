import Handsontable from "handsontable";

export default class DataPreparation {

    constructor(scope) {
        this.options = scope.field_model.data_model;
    }

    async summary(value) {
        const { app_id, count_field, credit_account_field, debit_account_field, date_field, summ_field } = this.options;

        if (!app_id || !count_field || !credit_account_field || !debit_account_field || !date_field || !summ_field) {
            return;
        }

        const items = await gudhub.getItems(app_id);

        const result = {};
        const splitRange = value.split(':');
        const rangeStart = Number(splitRange[0]);
        const rangeEnd = Number(splitRange[1]);

        for (const item of items) {
            const debitAccount = await gudhub.getInterpretationById(app_id, item.item_id, debit_account_field, 'value');
            const creditAccount = await gudhub.getInterpretationById(app_id, item.item_id, credit_account_field, 'value');

            if (!result[debitAccount]) {
                result[debitAccount] = {
                    past: [],
                    current: []
                };
            }

            if (!result[creditAccount]) {
                result[creditAccount] = {
                    past: [],
                    current: []
                }
            }

            const transaction = {
                summ: item.fields.find(field => field.field_id == summ_field)?.field_value,
                count: item.fields.find(field => field.field_id == count_field)?.field_value
            }

            const date = Number(item.fields.find(field => field.field_id == date_field)?.field_value);

            if (rangeStart < date && date < rangeEnd) {
                result[debitAccount].current.push({ type: 'debit', ...transaction });
                result[creditAccount].current.push({ type: 'credit', ...transaction });
            } else if (date < rangeStart) {
                result[debitAccount].past.push({ type: 'debit', ...transaction });
                result[creditAccount].past.push({ type: 'credit', ...transaction });
            }
        }

        const data = [
            ["Рахунок", "Сальдо на початок періоду", '', "Обороти за період", '', "Сальдо на кінець періоду", ''],
            ['', 'Дебет', 'Кредит', 'Дебет', 'Кредит', 'Дебет', 'Кредит']
        ];

        for (const index in result) {
            const pastResult = this.sumOperations(result[index].past, 'debit') - this.sumOperations(result[index].past, 'credit');
            const futureResult = (this.sumOperations(result[index].current, 'debit') - this.sumOperations(result[index].current, 'credit')) + pastResult;
            const arr = [
                index,
                pastResult > 0 ? pastResult : '',
                pastResult < 0 ? Math.abs(pastResult) : '',
                this.sumOperations(result[index].current, 'debit'),
                this.sumOperations(result[index].current, 'credit'),
                futureResult > 0 ? futureResult : '',
                futureResult < 0 ? Math.abs(futureResult) : ''
            ];
            data.push(arr);
        }

        if(data.length > 2) {
            data.push(['Разом', `=SUM(B3:B${data.length})`, `=SUM(C3:C${data.length})`, `=SUM(D3:D${data.length})`, `=SUM(E3:E${data.length})`, `=SUM(F3:F${data.length})`, `=SUM(G3:G${data.length})`]);
        }
        
        return {
            data,
            mergeCells: [
                { row: 0, col: 1, rowspan: 1, colspan: 2 },
                { row: 0, col: 3, rowspan: 1, colspan: 2 },
                { row: 0, col: 5, rowspan: 1, colspan: 2 },
                { row: 0, col: 0, rowspan: 2, colspan: 1 },
            ],
            cells(row, col) {
                const cellProperties = {};

                if (row === 0 || row === 1) {
                    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                        Handsontable.renderers.TextRenderer.apply(this, arguments);
                        td.style.fontWeight = 'bold';
                        td.style.background = 'rgb(204, 238, 204)';
                        td.style.color = 'green';
                        td.style.textAlign = 'center';
                    }
                }

                if (col === 0 && row !== 0 && row !== 1) {
                    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                        Handsontable.renderers.TextRenderer.apply(this, arguments);
                        td.style.fontWeight = 'bold';
                        td.style.textAlign = 'center';
                    }
                }

                if (row === data.length - 1 && col !== 0) {
                    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                        Handsontable.renderers.TextRenderer.apply(this, arguments);
                        td.style.fontWeight = 'bold';
                    }
                }

                return cellProperties;
            }
        };
    }

    async account(value, account) {
        const { app_id, count_field, credit_account_field, credit_subaccount_field, debit_account_field, debit_subaccount_field, date_field, summ_field } = this.options;

        if (!app_id || !count_field || !credit_account_field || !debit_account_field || !date_field || !summ_field) {
            return;
        }

        const items = await gudhub.getItems(app_id);

        const filteredItems = items.filter(item => {
            if(item.fields.find(field => field.field_id == debit_account_field)?.field_value == account) {
                return true;
            }
            if(item.fields.find(field => field.field_id == credit_account_field)?.field_value == account) {
                return true;
            }
            return false;
        });

        const result = {};
        const splitRange = value.split(':');
        const rangeStart = Number(splitRange[0]);
        const rangeEnd = Number(splitRange[1]);

        for (const item of filteredItems) {
            const debitSubaccount = await gudhub.getInterpretationById(app_id, item.item_id, debit_subaccount_field, 'value');
            const creditSubaccount = await gudhub.getInterpretationById(app_id, item.item_id, credit_subaccount_field, 'value');

            if (!result[debitSubaccount]) {
                result[debitSubaccount] = {
                    past: [],
                    current: []
                };
            }

            if (!result[creditSubaccount]) {
                result[creditSubaccount] = {
                    past: [],
                    current: []
                }
            }

            const transaction = {
                summ: item.fields.find(field => field.field_id == summ_field)?.field_value,
                count: item.fields.find(field => field.field_id == count_field)?.field_value
            }

            const date = Number(item.fields.find(field => field.field_id == date_field)?.field_value);

            if (rangeStart < date && date < rangeEnd) {
                if(item.fields.find(field => field.field_id == debit_account_field)?.field_value == account) {
                    result[debitSubaccount].current.push({ type: 'debit', ...transaction });
                }
                if(item.fields.find(field => field.field_id == credit_account_field)?.field_value == account) {
                    result[creditSubaccount].current.push({ type: 'credit', ...transaction });
                }
            } else if (date < rangeStart) {
                if(item.fields.find(field => field.field_id == debit_account_field)?.field_value == account) {
                    result[debitSubaccount].past.push({ type: 'debit', ...transaction });
                }
                if(item.fields.find(field => field.field_id == credit_account_field)?.field_value == account) {
                    result[creditSubaccount].past.push({ type: 'credit', ...transaction });
                }
            }
        }

        const data = [
            ["Субконто", "Сальдо на початок періоду", '', "Обороти за період", '', "Сальдо на кінець періоду", ''],
            ['', 'Дебет', 'Кредит', 'Дебет', 'Кредит', 'Дебет', 'Кредит']
        ];

        for (const index in result) {

            if(result[index].past.length == 0 && result[index].current.length == 0) {
                continue;
            }

            const pastResult = this.sumOperations(result[index].past, 'debit') - this.sumOperations(result[index].past, 'credit');
            const futureResult = (this.sumOperations(result[index].current, 'debit') - this.sumOperations(result[index].current, 'credit')) + pastResult;
            const arr = [
                index,
                pastResult > 0 ? pastResult : '',
                pastResult < 0 ? Math.abs(pastResult) : '',
                this.sumOperations(result[index].current, 'debit'),
                this.sumOperations(result[index].current, 'credit'),
                futureResult > 0 ? futureResult : '',
                futureResult < 0 ? Math.abs(futureResult) : ''
            ];
            data.push(arr);
        }

        if(data.length > 2) {
            data.push(['Разом', `=SUM(B3:B${data.length})`, `=SUM(C3:C${data.length})`, `=SUM(D3:D${data.length})`, `=SUM(E3:E${data.length})`, `=SUM(F3:F${data.length})`, `=SUM(G3:G${data.length})`]);
        }

        return {
            data,
            mergeCells: [
                { row: 0, col: 1, rowspan: 1, colspan: 2 },
                { row: 0, col: 3, rowspan: 1, colspan: 2 },
                { row: 0, col: 5, rowspan: 1, colspan: 2 },
                { row: 0, col: 0, rowspan: 2, colspan: 1 },
            ],
            cells(row, col) {
                const cellProperties = {};

                if (row === 0 || row === 1) {
                    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                        Handsontable.renderers.TextRenderer.apply(this, arguments);
                        td.style.fontWeight = 'bold';
                        td.style.background = 'rgb(204, 238, 204)';
                        td.style.color = 'green';
                        td.style.textAlign = 'center';
                    }
                }

                if (col === 0 && row !== 0 && row !== 1) {
                    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                        Handsontable.renderers.TextRenderer.apply(this, arguments);
                        td.style.fontWeight = 'bold';
                        td.style.textAlign = 'center';
                    }
                }

                if (row === data.length - 1 && col !== 0) {
                    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                        Handsontable.renderers.TextRenderer.apply(this, arguments);
                        td.style.fontWeight = 'bold';
                    }
                }

                return cellProperties;
            }
        };
    }

    async accountCard(value, account) {
        const { app_id, count_field, credit_account_field, credit_subaccount_field, debit_account_field, debit_subaccount_field, date_field, summ_field, document_field } = this.options;

        if (!app_id || !count_field || !credit_account_field || !debit_account_field || !date_field || !summ_field || !document_field) {
            return;
        }

        const items = await gudhub.getItems(app_id);

        const filteredItems = items.filter(item => {
            if(item.fields.find(field => field.field_id == debit_account_field)?.field_value == account) {
                return true;
            }
            if(item.fields.find(field => field.field_id == credit_account_field)?.field_value == account) {
                return true;
            }
            return false;
        });

        let result = [];
        const previousTransactions = [];
        const splitRange = value.split(':');
        const rangeStart = Number(splitRange[0]);
        const rangeEnd = Number(splitRange[1]);

        for (const item of filteredItems) {
            const debitSubaccount = await gudhub.getInterpretationById(app_id, item.item_id, debit_subaccount_field, 'value');
            const creditSubaccount = await gudhub.getInterpretationById(app_id, item.item_id, credit_subaccount_field, 'value');
            const document = await gudhub.getInterpretationById(app_id, item.item_id, document_field, 'value');
            const creditAccount = await gudhub.getInterpretationById(app_id, item.item_id, credit_account_field, 'value');
            const debitAccount = await gudhub.getInterpretationById(app_id, item.item_id, debit_account_field, 'value');

            const transaction = {
                summ: item.fields.find(field => field.field_id == summ_field)?.field_value,
                count: item.fields.find(field => field.field_id == count_field)?.field_value,
                document,
                credit_account: creditAccount,
                debit_account: debitAccount,
                credit_account_ref: item.fields.find(field => field.field_id == credit_account_field)?.field_value,
                debit_account_ref: item.fields.find(field => field.field_id == debit_account_field)?.field_value,
                analytics_dt: debitSubaccount,
                analytics_kt: creditSubaccount,
                date: Number(item.fields.find(field => field.field_id == date_field)?.field_value)
            }

            if (rangeStart < transaction.date && transaction.date < rangeEnd) {
                result.push(transaction)
            } else if (transaction.date < rangeStart) {
                previousTransactions.push(transaction)
            }
        }

        result = result.sort((a, b) => a.date - b.date);

        const beforeSaldos = previousTransactions.reduce((acc, item) => {
            if(item.debit_account_ref == account) {
                return acc + Number(item.summ);
            }
            if(item.credit_account_ref == account) {
                return acc - Number(item.summ);
            }
            return acc;
        }, 0);

        const data = [
            ["Період", "Документ", 'Аналітика Дт', "Аналітика Кт", 'Дебет', '', "Кредит", '', 'Поточне сальдо'],
            ['', '', '', '', 'Рахунок', 'Сума Дт', 'Рахунок', 'Сума Кт', ''],
            ['Сальдо на початок періоду', '', '', '', '', '', '', '', `${beforeSaldos}`]
        ];

        for (const transaction of result) {

            const lastSumm = data[data.length - 1][8];

            let modifiedSumm;

            if(transaction.debit_account_ref == account) {
                modifiedSumm = Number(lastSumm) + Number(transaction.summ);
            }

            if(transaction.credit_account_ref == account) {
                modifiedSumm = Number(lastSumm) - Number(transaction.summ);
            }

            const arr = [
                new Date(transaction.date).toLocaleDateString('uk'),
                transaction.document,
                transaction.analytics_dt,
                transaction.analytics_kt,
                transaction.debit_account,
                transaction.debit_account_ref == account ? transaction.summ : '',
                transaction.credit_account,
                transaction.credit_account_ref == account ? transaction.summ : '',
                modifiedSumm
            ];
            data.push(arr);
        }

        if(data.length > 3) {
            data.push(['Обороти за період та сальдо на кінець', '', '', '', '', `=SUM(F3:F${data.length})`, '', `=SUM(H3:H${data.length})`, `${ data[data.length - 1][8]}`]);
        }

        return {
            data,
            mergeCells: [
                { row: 0, col: 0, rowspan: 2, colspan: 1 },
                { row: 0, col: 1, rowspan: 2, colspan: 1 },
                { row: 0, col: 2, rowspan: 2, colspan: 1 },
                { row: 0, col: 3, rowspan: 2, colspan: 1 },
                { row: 0, col: 4, rowspan: 1, colspan: 2 },
                { row: 0, col: 6, rowspan: 1, colspan: 2 },
                { row: 0, col: 8, rowspan: 2, colspan: 1 },
                // Start row
                { row: 2, col: 0, rowspan: 1, colspan: 8 },
                // Last row
                { row: data.length - 1, col: 0, rowspan: 1, colspan: 4 },
            ],
            cells(row, col) {
                const cellProperties = {};

                if (row === 0 || row === 1 || row === 2) {
                    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                        Handsontable.renderers.TextRenderer.apply(this, arguments);
                        td.style.fontWeight = 'bold';
                        td.style.background = 'rgb(204, 238, 204)';
                        td.style.color = 'green';
                        td.style.textAlign = 'center';
                    }

                    if(row === 2 && col === 0) {
                        cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                            Handsontable.renderers.TextRenderer.apply(this, arguments);
                            td.style.fontWeight = 'bold';
                            td.style.background = 'rgb(204, 238, 204)';
                            td.style.color = 'green';
                            td.style.textAlign = 'left';
                        }
                    }

                }

                if (col === 0 && row !== 0 && row !== 1 && row !== 2) {
                    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                        Handsontable.renderers.TextRenderer.apply(this, arguments);
                        td.style.fontWeight = 'bold';
                        td.style.textAlign = 'center';
                    }
                }

                if (row === data.length - 1) {
                    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                        Handsontable.renderers.TextRenderer.apply(this, arguments);
                        td.style.fontWeight = 'bold';
                        td.style.background = 'rgb(204, 238, 204)';
                        td.style.color = 'green';
                    }

                    if(col === 0) {
                        cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                            Handsontable.renderers.TextRenderer.apply(this, arguments);
                            td.style.fontWeight = 'bold';
                            td.style.background = 'rgb(204, 238, 204)';
                            td.style.color = 'green';
                            td.style.textAlign = 'left';
                        }
                    }
                }

                return cellProperties;
            }
        };
    }

    sumOperations(operations, type) {
        return operations.reduce((acc, item) => {
            if (item.type === type) {
                return acc + (Number(item.summ) || 0);
            }
            return acc;
        }, 0);
    }
}