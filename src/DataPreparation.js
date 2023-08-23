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

        data.push(['Разом', `=SUM(B3:B${data.length})`, `=SUM(C3:C${data.length})`, `=SUM(D3:D${data.length})`, `=SUM(E3:E${data.length})`, `=SUM(F3:F${data.length})`, `=SUM(G3:G${data.length})`]);
        return data;
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

        if(Object.keys(result).length == 0) {
            return data;
        }

        data.push(['Разом', `=SUM(B3:B${data.length})`, `=SUM(C3:C${data.length})`, `=SUM(D3:D${data.length})`, `=SUM(E3:E${data.length})`, `=SUM(F3:F${data.length})`, `=SUM(G3:G${data.length})`]);
        return data;
    }

    sumOperations(operations, type) {
        return operations.reduce((acc, item) => {
            if (item.type === type) {
                return acc + Number(item.summ);
            }
            return acc;
        }, 0);
    }
}