import GhHtmlElement from "@gudhub/gh-html-element";
import html from "./balance-sheet.html";
import './style.scss';

import Handsontable from "handsontable";
import HyperFormula from 'hyperformula';
import "handsontable/dist/handsontable.full.css";

const hyperformulaInstance = HyperFormula.buildEmpty();

import './tabs/tabs.webcomponent.js';

import DataPreparation from "./DataPreparation.js";

class GhBalanceSheet extends GhHtmlElement {

    // Constructor with super() is required for native web component initialization

    constructor() {
        super();
        this.table;
        this.account;
    }

    // onInit() is called after parent gh-element scope is ready

    async onInit() {

        this.dataPreparation = new DataPreparation(this.scope);

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

        this.accounts = {
            app_id: this.scope.field_model.data_model.accounts_app_id,
            field_id: this.scope.field_model.data_model.account_field
        }
        
        const accountDecorator = {
            data_type: 'item_ref',
            field_name: 'Рахунок',
            data_model: {
                refs: [
                    {
                        app_id: this.accounts.app_id,
                        field_id: this.accounts.field_id
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

        const data = await this.dataPreparation.summary(this.value);

        this.querySelector('gh-balance-sheet-tabs').addEventListener('tabChange', (event) => {
            this.account = event.detail.data;
            this.onUpdate();
        });

        this.renderTable(data);
    }

    // onUpdate() is called after value was updated

    async onUpdate() {
        if (this.value && !Array.isArray(this.value)) {
            let data;
            if(this.account) {
                data = await this.dataPreparation.account(this.value, this.account);
            } else {
                data = await this.dataPreparation.summary(this.value);
            }
            this.table.loadData(data);
        }
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
            contextMenu: {
                items: {
                    'add_tab': {
                        name: 'ОСВ за рахунком',
                        callback: async (key, selection, clickEvent) => {
                            const account = data[selection[0].start.row][0];

                            const app = await gudhub.getApp(this.accounts.app_id);

                            const item = app.items_list.find(item => {
                                const field = item.fields.find(field => field.field_id == this.accounts.field_id);
                                if(field && field.field_value == account) {
                                    return true;
                                }
                            })

                            if(!item) {
                                return;
                            }

                            this.querySelector('gh-balance-sheet-tabs').addTab({
                                name: `ОСВ за рахунком ${account}`,
                                type: 'account',
                                data: `${this.accounts.app_id}.${item.item_id}`
                            });
                        }
                    }
                }
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