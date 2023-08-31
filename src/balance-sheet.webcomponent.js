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
        this.reportType = 'summary';
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

        this.accounts = {
            app_id: this.scope.field_model.data_model.accounts_app_id,
            field_id: this.scope.field_model.data_model.account_field
        }

        if (!this.value) {
            this.value = `${gudhub.util.getDate('month_past,past') + 86400000}:${gudhub.util.getDate('month_current,current')}`
        }

        const data = await this.dataPreparation.summary(this.value);

        this.querySelector('gh-balance-sheet-tabs').addEventListener('tabChange', (event) => {
            this.account = event.detail.data;
            this.reportType = event.detail.type;
            this.onUpdate();
        });

        this.renderTable(data);
    }

    // onUpdate() is called after value was updated

    async onUpdate() {
        if (this.value && !Array.isArray(this.value)) {
            let data;
            switch(this.reportType) {
                case 'summary':
                    data = await this.dataPreparation.summary(this.value);
                    break;
                case 'account':
                    data = await this.dataPreparation.account(this.value, this.account);
                    break;
                case 'accountCard':
                    data = await this.dataPreparation.accountCard(this.value, this.account);
                    break;
            }
            this.table.loadData(data.data);
            this.table.updateSettings({
                mergeCells: data.mergeCells,
                cells: data.cells
            });
        }
    }

    async renderTable(data) {
        const container = this.querySelector('.balance-sheet');

        this.table = new Handsontable(container, {
            licenseKey: 'non-commercial-and-evaluation',
            readOnly: true,
            data: data.data,
            rowHeaders: false,
            colHeaders: false,
            colWidths: 150,
            width: '100%',
            height: 'auto',
            mergeCells: data.mergeCells,
            formulas: {
                engine: hyperformulaInstance
            },
            contextMenu: {
                items: {
                    'add_tab': {
                        name: 'ОСВ за рахунком',
                        callback: async (key, selection, clickEvent) => {
                            const account = data.data[selection[0].start.row][0];

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
                                data: `${this.accounts.app_id}.${item.item_id}`,
                                closable: true
                            });
                        }
                    },
                    'account_card': {
                        name: 'Картка рахунку',
                        callback: async (key, selection, clickEvent) => {
                            const account = data.data[selection[0].start.row][0];

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
                                name: `Картка рахунку ${account}`,
                                type: 'accountCard',
                                data: `${this.accounts.app_id}.${item.item_id}`,
                                closable: true
                            });
                        }
                    }
                }
            },
            cells: data.cells
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