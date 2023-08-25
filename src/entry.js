import './balance-sheet.webcomponent.js';

export default class GhInputData {

    /*------------------------------- FIELD TEMPLATE --------------------------------------*/

    getTemplate() {
        return {
            constructor: 'field',
            name: 'Balance Sheet',
            icon: 'table',
            model: {
                field_id: 0,
                field_name: 'Balance Sheet',
                field_value: '',
                data_type: 'balance_sheet',
                data_model: {
                    interpretation: [{
                        src: 'form',
                        id: 'default',
                        settings: {
                            editable: 1,
                            show_field_name: 1,
                            show_field: 1
                        },
                        style: { position: "beetwen" }
                    }]
                }
            }
        };
    }

    /*------------------------------- INTERPRETATION --------------------------------------*/

    getInterpretation(gudhub, value, appId, itemId, field_model) {

        return [{
            id: 'default',
            name: 'Default',
            content: () =>
                '<gh-balance-sheet app-id="{{appId}}" item-id="{{itemId}}" field-id="{{fieldId}}"></gh-balance-sheet>'
        }, {
            id: 'value',
            name: 'Value',
            content: () => value
        }];
    }

    /*--------------------------  SETTINGS --------------------------------*/

    getSettings(scope) {
        return [{
            title: 'Options',
            type: 'general_setting',
            icon: 'menu',
            columns_list: [
                [],
                [
                    {
                        title: "Operations",
                        type: "header"
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.app_id',
                        data_model: function () {
                            return {
                                data_type: 'app',
                                field_name: 'Operations App',
                                name_space: 'operations_app',
                                data_model: {
                                    current_app: false,
                                    interpretation: [{
                                        src: 'form',
                                        id: 'with_text',
                                        settings: {
                                            editable: 1,
                                            show_field_name: 1,
                                            show_field: 1
                                        },
                                    }]
                                }
                            }
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.debit_account_field',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Debit account field',
                                name_space: 'debit_account_field',
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.credit_account_field',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Credit account field',
                                name_space: 'credit_account_field',
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.debit_subaccount_field',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Debit subaccount field',
                                name_space: 'debit_subaccount_field',
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.credit_subaccount_field',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Credit subaccount field',
                                name_space: 'credit_subaccount_field',
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.date_field',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Date field',
                                name_space: 'date_field',
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.summ_field',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Summ field',
                                name_space: 'summ_field',
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.count_field',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Count field',
                                name_space: 'count_field',

                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.document_field',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Document field',
                                name_space: 'document_field',

                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    }
                ],
                [
                    {
                        title: "Accounts",
                        type: "header"
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.accounts_app_id',
                        data_model: function() {
                            return {
                                data_type: 'app',
                                field_name: 'Accounts App',
                                name_space: 'accounts_app',
                                data_model: {
                                    current_app: false,
                                    interpretation: [{
                                        src: 'form',
                                        id: 'with_text',
                                        settings: {
                                            editable: 1,
                                            show_field_name: 1,
                                            show_field: 1
                                        },
                                    }]
                                }
                            }
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.account_field',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Account field',
                                name_space: 'account_field',
                                data_model: {
                                    app_id: fieldModel.data_model.accounts_app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.accounts_app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    }
                ]
            ]
        }];
    }
}