jQuery(function ($) {
    'use strict';

    var ENTER_KEY = 13;
    var NAMESPACES_LOCAL_STORAGE = 'todo-items';

    var ViewTodo = {
        init: function (model) {
            this._model = model;
        },
        printAll: function () {
            var tmpl = $("#list-template").html();
            var itemsTodo = this._model.getFilterItems();
            this.renderHeader();
            $("#list-todo").html(_.template(tmpl)({items: itemsTodo}));
            this.renderFooter();
        },

        renderHeader: function () {
            var tmpl = $("#counter-list-template").html();
            $('.counter').html(_.template(tmpl)({
                'countActive':this.getActiveItems().length,
                'countCompleted':this.getCompletedItems().length
            }));
            var tmplBtnRemove = $('#remove-btn-template').html();
            $('.btn-remove-all').html(_.template(tmplBtnRemove)({
                'countCompleted':this._model.getCompletedItems().length
            }));
        },

        renderFooter: function () {
            if (this.todoItem.length > 0)
            {
                var tmpl = $("#footer-list-template").html();
                $("#footer").html(_.template(tmpl));
                $("#btn-"+this.filter).css('background-color', 'gainsboro');
            }
            else{
                $("#footer").html('');
            }
        }
        
    };

    var ControllerTodo = {
        
        init: function (model) {
            $('#add-todo').on('click', model.createButton.bind(model));
            $('#new-todo').on('keydown',model.createEnter.bind(model));
            $('#header').on('change','#choose-all', model.toggleAllItem.bind(model));
            $('#header').on('click','#remove-completed-todo',model.removeCompleted.bind(model));
            $('#list-todo')
                            .on('click','.btn-remove-item', model.removeItem.bind(model))
                            .on('change','.change-todo', model.toggleItem.bind(model))
                            .on('dblclick','p', model.edit.bind(model))
                            .on('keydown','.editor',model.editKeyDown.bind(model))
                            .on('focusout','.editor',model.update.bind(model));
            $('#footer')
                            .on('click','#btn-all',model.setFilter.bind(model))
                            .on('click','#btn-active',model.setFilter.bind(model))
                            .on('click','#btn-completed',model.setFilter.bind(model));

        }
        
    };
    
    var ModelTodo ={
        init: function () {
            this.todoItem = this.storage(NAMESPACES_LOCAL_STORAGE);
            this.filter = 'all';
            this.printAll();
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

        setFilter: function (e) {
            var filter = $(e.target).closest('button').data('filter');
            this.filter = filter;
            this.printAll();
        },

        getFilterItems: function () {
            if (this.filter==='active'){
                return this.getActiveItems();
            }
            if (this.filter==='completed'){
                return this.getCompletedItems();
            }
            return this.todoItem;
        },

        printAll: function () {
            var tmpl = $("#list-template").html();
            var itemsTodo = this.getFilterItems();
            this.renderHeader();
            $("#list-todo").html(_.template(tmpl)({items: itemsTodo}));
            this.renderFooter();
            this.storage(NAMESPACES_LOCAL_STORAGE,this.todoItem);
        },

        renderHeader: function () {
            var tmpl = $("#counter-list-template").html();
            $('.counter').html(_.template(tmpl)({
                'countActive':this.getActiveItems().length,
                'countCompleted':this.getCompletedItems().length
            }));
            var tmplBtnRemove = $('#remove-btn-template').html();
            $('.btn-remove-all').html(_.template(tmplBtnRemove)({
                'countCompleted':this.getCompletedItems().length
                }));
        },

        renderFooter: function () {
            if (this.todoItem.length > 0)
                {
                    var tmpl = $("#footer-list-template").html();
                    $("#footer").html(_.template(tmpl));
                    $("#btn-"+this.filter).css('background-color', 'gainsboro');
                }
                else{
                $("#footer").html('');
            }
        },

        toggleAllItem: function (e) {
            var isChecked = $(e.target).prop('checked');
            this.todoItem.forEach(function (item) {
                item.completed = isChecked;
            });
            this.printAll();
        },

        createEnter: function (e) {
            if(e.which === ENTER_KEY)
            {
                var $input = $(e.target);
                var value = $input.val().trim();
                if(value!=='') {
                    $input.val('');
                    this.add(value);
                }
            }
        },

        createButton: function (e) {
            var $input = $('#new-todo');
            var value = $input.val().trim();
            if(value!=='') {
                $input.val('');
                this.add(value);
            }
        },

        newId: function () {
            var res = '';
            var date = new Date();
            res+=Math.round(date.getMilliseconds()/7)+'-'+Math.round(date.getMilliseconds()/4);
          return res;
        },

        add: function (data) {
            this.todoItem.push({
                id: this.newId(),
                title: data,
                completed: false
            });
            this.printAll();
        },

        edit: function (e) {
            var $input = $(e.target).closest('li').addClass('edit-item').find('.editor');
            $input.val($input.val()).focus();
        },

        editKeyDown: function (e) {
            if (e.which===ENTER_KEY){
                e.target.blur();
            }
        },

        findItem: function (e) {
            var idItem = $(e.target).closest('li').data('id');
            return _.find(this.todoItem, function (item) {
                return item.id==idItem;
            });
        },

        update: function (e) {
            var newValue = $(e.target).val().trim();
            if(!newValue){
                this.removeItem(e);
                return;
            }
            this.findItem(e).title = newValue;
            this.printAll();
        },

        toggleItem: function (e) {
            var isChecked = $(e.target).prop('checked');
            this.findItem(e).completed = isChecked;
            this.printAll();
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
            var completedItem = this.getCompletedItems();
            this.todoItem =_.difference(this.todoItem, completedItem);
            this.printAll();
        },

        removeItem: function (e) {
            var item = this.findItem(e);
            _.remove(this.todoItem, item);
            this.printAll();
        }
        
    };
        ModelTodo.init();
        ViewTodo.init(ModelTodo);
        ControllerTodo.init(ModelTodo,ViewTodo);
});