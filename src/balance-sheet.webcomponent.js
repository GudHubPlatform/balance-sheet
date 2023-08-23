import GhHtmlElement from "@gudhub/gh-html-element";
import html from "./balance-sheet.html";
import './style.scss';

import Handsontable from "handsontable";
import HyperFormula from 'hyperformula';
import "handsontable/dist/handsontable.full.css";

const hyperformulaInstance = HyperFormula.buildEmpty({

});

class GhBalanceSheet extends GhHtmlElement {

    // Constructor with super() is required for native web component initialization

    constructor() {
        super();
        this.table;
        this.account;
    }

    // onInit() is called after parent gh-element scope is ready

    async onInit() {
        super.render(html);

        const container = angular.element(this.querySelector('.range'));

        const decorator = {
            data_type: 'date',
            field_name: 'Період',
            data_model: {
                data_range: true
            }
        }

        const element = angular.element(`<gh-element decorator='${JSON.stringify(decorator)}' value="value"></gh-element>`);
        const compiler = gudhub.ghconstructor.angularInjector.get('$compile');
        const compiled = compiler(element);

        container.append(element);

        compiled(this.scope);

        const accountContainer = angular.element(this.querySelector('.account'));

        const accountDecorator = {
            data_type: 'item_ref',
            field_name: 'Рахунок',
            data_model: {
                refs: [
                    {
                        app_id: this.scope.field_model.data_model.accounts_app_id,
                        field_id: this.scope.field_model.data_model.account_field
                    }
                ]
            }
        }

        const accountElement = angular.element(`<gh-element decorator='${JSON.stringify(accountDecorator)}' value="account"></gh-element>`);
        const accountCompiled = compiler(accountElement);

        accountContainer.append(accountElement);

        accountCompiled(this.scope);

        this.scope.$watch('account', (newValue, oldValue) => {
            if(newValue !== oldValue) {
                this.account = newValue;
                this.onUpdate();
            }
        });

        if (!this.value) {
            this.value = `${gudhub.util.getDate('month_past,past') + 86400000}:${gudhub.util.getDate('month_current,current')}`
        }

        const data = await this.prepareData();

        this.renderTable(data);
    }

    // onUpdate() is called after value was updated

    async onUpdate() {
        if (this.value && !Array.isArray(this.value)) {
            let data;
            if(this.account) {
                data = await this.prepareAccountData();
            } else {
                data = await this.prepareData();
            }
            this.table.loadData(data);
        }
    }

    async prepareData() {
        const { app_id, count_field, credit_account_field, credit_subaccount_field, debit_account_field, debit_subaccount_field, date_field, summ_field } = this.scope.field_model.data_model;

        if (!app_id || !count_field || !credit_account_field || !debit_account_field || !date_field || !summ_field) {
            return;
        }

        const items = await gudhub.getItems(app_id);

        const result = {};
        const splitRange = this.value.split(':');
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

    async prepareAccountData() {
        const { app_id, count_field, credit_account_field, credit_subaccount_field, debit_account_field, debit_subaccount_field, date_field, summ_field } = this.scope.field_model.data_model;

        if (!app_id || !count_field || !credit_account_field || !debit_account_field || !date_field || !summ_field) {
            return;
        }

        const items = await gudhub.getItems(app_id);

        const filteredItems = items.filter(item => {
            if(item.fields.find(field => field.field_id == debit_account_field)?.field_value == this.account) {
                return true;
            }
            if(item.fields.find(field => field.field_id == credit_account_field)?.field_value == this.account) {
                return true;
            }
            return false;
        });

        const result = {};
        const splitRange = this.value.split(':');
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
                if(item.fields.find(field => field.field_id == debit_account_field)?.field_value == this.account) {
                    result[debitSubaccount].current.push({ type: 'debit', ...transaction });
                }
                if(item.fields.find(field => field.field_id == credit_account_field)?.field_value == this.account) {
                    result[creditSubaccount].current.push({ type: 'credit', ...transaction });
                }
            } else if (date < rangeStart) {
                if(item.fields.find(field => field.field_id == debit_account_field)?.field_value == this.account) {
                    result[debitSubaccount].past.push({ type: 'debit', ...transaction });
                }
                if(item.fields.find(field => field.field_id == credit_account_field)?.field_value == this.account) {
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

    async renderTable(data) {
        const container = this.querySelector('.balance-sheet');

        this.table = new Handsontable(container, {
            licenseKey: 'non-commercial-and-evaluation',
            data,
            rowHeaders: false,
            colHeaders: false,
            colWidths: 150,
            mergeCells: [
                { row: 0, col: 1, rowspan: 1, colspan: 2 },
                { row: 0, col: 3, rowspan: 1, colspan: 2 },
                { row: 0, col: 5, rowspan: 1, colspan: 2 },
                { row: 0, col: 0, rowspan: 2, colspan: 1 },
            ],
            formulas: {
                engine: hyperformulaInstance
            },
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
        });

    }

    sumOperations(operations, type) {
        return operations.reduce((acc, item) => {
            if (item.type === type) {
                return acc + Number(item.summ);
            }
            return acc;
        }, 0);
    }

    exportToCSV() {
        const exportPlugin = this.table.getPlugin('exportFile');

        exportPlugin.downloadFile('csv', {
            bom: false,
            columnDelimiter: ',',
            columnHeaders: false,
            exportHiddenColumns: true,
            exportHiddenRows: true,
            fileExtension: 'csv',
            filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
            mimeType: 'text/csv',
            rowDelimiter: '\r\n',
            rowHeaders: true
        });
    }

}

// Register web component only if it is not registered yet

if (!customElements.get('gh-balance-sheet')) {
    customElements.define('gh-balance-sheet', GhBalanceSheet);
}