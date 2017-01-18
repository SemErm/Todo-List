jQuery(function ($) {
    'use strict';

    var ENTER_KEY = 13;
    var NAMESPACES_LOCAL_STORAGE = 'todo-items';

    var ViewTodo = {
        init: function (model) {
            this._model = model;
            this.createElemets();
            this.currentPage = 1;
            this.numberItems = 5;
            this.renderAll();
        },

        curPage: function () {
            var len = this._model.getFilterItems().length;
            if(len % this.numberItems == 0){
                this.currentPage = len / this.numberItems;
            }
            else{
                this.currentPage = Math.round(len / this.numberItems - (len % this.numberItems / this.numberItems)+ 1);
            }
        },

       renderAll: function () {
            var tmpl = $("#list-template").html();
            var itemsTodo = this._model.getSliceItems(
                (this.currentPage - 1)*this.numberItems,
                this.currentPage*this.numberItems
            );
            this.renderHeader();
            this.listItems.html(_.template(tmpl)({items: itemsTodo}));
            this.renderFooter();
        },

        renderHeader: function () {
            var tmpl = $("#counter-list-template").html();
            $('.counter').html(_.template(tmpl)({
                'countActive':this._model.getActiveItems().length,
                'countCompleted':this._model.getCompletedItems().length
            }));
        },

        renderFooter: function () {
            if (this._model.getFilterItems('all').length > 0)
            {
                var tmpl = $("#footer-list-template").html();
                $("#footer").html(_.template(tmpl));
                $("#btn-"+this._model.filter).css('background-color', 'gainsboro');
            }
            else{
                $("#footer").html('');
            }
        },

        createElemets: function () {
            this.buttonAdd = $("#add-todo");
            this.inputAdd = $("#new-todo");
            this.buttonRemoveAll = $('#remove-completed-todo');
            this.toggleAll = $('#choose-all');
            this.toggleItem = '.change-todo';
            this.listItems = $('#list-todo');
            this.buttonRemoveItem = '.btn-remove-item';
            this.textItem = 'p';
            this.editor = '.editor';
            this.footer = $('#footer');
            this.btnFilter = '.filter';
            this.btnPagination = '.pagination';

            this.buttonFilter = function (target) {
                this.currentPage = 1;
                return target.closest('button').data('filter');
            };

            this.getId = function (target) {
                return target.closest('li').data('id');
            };

            this.btnChangePage = function (target) {
                var func = target.closest('button').data('page');
                switch (func) {
                    case 'inc':
                        if(this.currentPage * this.numberItems < this._model.getFilterItems().length){
                            this.currentPage++;
                        }
                        break;
                    case 'dec':
                        if (this.currentPage !== 1) {
                            this.currentPage--;
                        }
                        break;
                }
                console.log(this.currentPage);
            }
        }

    };

    var ControllerTodo = {

        init: function (model,view) {
            view.buttonAdd
                .on('click', function () {
                    if(model.addItem(view.inputAdd.val())){
                        view.inputAdd.val('');
                        view.curPage();
                        view.renderAll()
                    }
                });

            view.inputAdd
                .on('keydown', function(e){
                    var key = e.which;
                    if(model.createEnter(key,view.inputAdd.val())){
                        view.inputAdd.val('');
                        view.curPage();
                        view.renderAll();
                    }
                });

            view.toggleAll
                .on('change',function(){
                    model.toggleAllItem(view.toggleAll.prop('checked'));
                    view.renderAll();
                });

            view.buttonRemoveAll
                .on('click', function(){
                    model.removeCompleted();
                    view.curPage();
                    view.renderAll();
                });

            view.listItems
                .on('click',view.buttonRemoveItem,function (e) {
                    model.removeItem(view.getId($(e.target)));
                    view.curPage();
                    view.renderAll();
                })
                .on('change',view.toggleItem,function (e) {
                    var prop = $(e.target).prop('checked');
                    model.toggleItem(view.getId($(e.target)),prop);
                    view.renderAll();
                })
                .on('dblclick',view.textItem, function (e) {
                    var $input = $(e.target).closest('li').addClass('edit-item').find('.editor');
                    $input.val($input.val()).focus();
                })
                .on('keydown',view.editor,function (e) {
                   if(e.which===ENTER_KEY){
                       $(e.target).blur();
                   }
                })
                .on('focusout',view.editor, function (e) {
                    var data = $(e.target).val();
                    $(e.target).val('');
                    model.update(view.getId($(e.target)),data);
                    view.renderAll();
                });

            view.footer
                .on('click',view.btnFilter,function(e){
                    model.setFilter(view.buttonFilter($(e.target)));
                    view.renderAll();
                })
                .on('click', view.btnPagination, function(e){
                    view.btnChangePage($(e.target));
                    view.renderAll();
                });
        }

    };

    var ModelTodo ={
        init: function () {
            this.todoItem = this.storage(NAMESPACES_LOCAL_STORAGE);
            this.filter = 'all';
        },

        storage: function (namespaces,data) {
            if(arguments.length>1){
                localStorage.setItem(namespaces, JSON.stringify(data));
            }
            else{
                var results = localStorage.getItem(namespaces);
                return JSON.parse(results) || [];
            }
        },

        updateAllTodo:function () {
            this.storage(NAMESPACES_LOCAL_STORAGE, this.todoItem);
        },

        setFilter: function (filter) {
            this.filter = filter;
        },

        getSliceItems: function (start, end) {
            return _.slice(this.getFilterItems(),start,end);
        },

        getFilterItems: function (filter) {
            if(arguments.length>0)
                return this.todoItem;
            if (this.filter==='active'){
                return this.getActiveItems();
            }
            if (this.filter==='completed'){
                return this.getCompletedItems();
            }
            return this.todoItem;
        },

        toggleAllItem: function (prop) {
            this.todoItem.forEach(function (item) {
                item.completed = prop;
            });
            this.updateAllTodo();
        },

        createEnter: function (key, data) {
            if(key === ENTER_KEY) {
                return this.addItem(data);
            }
        },

        newId: function () {
            var date = new Date();
            return Math.round(date.getMilliseconds()/7)+'-'+Math.round(date.getMilliseconds()/4);
        },

        addItem: function (data) {
            var _data = data.trim();
            if(_data!=='') {
                this.todoItem.push({
                    id: this.newId(),
                    title: _data,
                    completed: false
                });
                this.updateAllTodo();
                return true;
            }
            else return false;
        },

        findItem: function (idItem) {
            return _.find(this.todoItem, function (item) {
                return item.id==idItem;
            });
        },

        update: function (id,data) {
            var _data = data.trim();
            if(!_data){
                this.removeItem(id);
                return;
            }
            this.findItem(id).title = _data;
            this.updateAllTodo();
        },

        toggleItem: function (idData, prop) {
            this.findItem(idData).completed = prop;
            this.updateAllTodo();
        },

        getCompletedItems: function () {
            return this.todoItem.filter(function (item) {
                return item.completed;
            })
        },

        getActiveItems: function () {
            return this.todoItem.filter(function (item) {
                return !item.completed;
            })
        },

        removeCompleted: function () {
            this.todoItem =_.difference(this.todoItem, this.getCompletedItems());
            this.updateAllTodo();
        },

        removeItem: function (idItem) {
            this.todoItem = _.remove(this.todoItem, function (item) {
                return item.id!== idItem;
            });
            this.updateAllTodo();
        }

    };

    ModelTodo.init();
    ViewTodo.init(ModelTodo);
    ControllerTodo.init(ModelTodo,ViewTodo);
});