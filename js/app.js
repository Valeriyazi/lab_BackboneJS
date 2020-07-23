(function ($) {
    var cosms = [
        { price: "2$", name: "Оладушки", type: "Завтрак" },
        { price: "3$", name: "Банановый пирог", type: "Выпечка" },
        { price: "5$", name: "Плов", type: "Горячее" },
        { price: "3$", name: "Чизкейк", type: "Десерты" },
    ];
    var Cosm = Backbone.Model.extend({
        defaults: {
            name: "",
            type: "",
            price: ""
        }
    });

    var Directory = Backbone.Collection.extend({
        model: Cosm
    });

    var ContactView = Backbone.View.extend({
        tagName: "article",
        className: "cosmContainer",
        template: _.template($("#contactTemplate").html()),

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
        events: {
            "click button.delete": "deleteContact"
        },

        deleteContact: function () {
            var removedType = this.model.get("type").toLowerCase();
            //удаление модели
            this.model.destroy();
            //удаление со страницы
            this.remove();
            //обновление списка, если нет раздела важности
            if (_.indexOf(directory.getTypes(), removedType) === -1) {
                directory.$el.find("#filter select").children("[value='" + removedType + "']").remove();
            }
        }
    });

    var DirectoryView = Backbone.View.extend({
        el: $("#cosms"),
        initialize: function () {
            this.collection = new Directory(cosms);

            this.render();//обработка шаблона
            this.$el.find("#filter").append(this.createSelect());//добавление элемента на страницу

            this.on("change:filterType", this.filterByType, this);//смена фильтра
            this.collection.on("reset", this.render, this);//сброс коллекции и перезагрузка
            this.collection.on("add", this.renderTodo, this);
            this.collection.on("remove", this.removeContact, this);
        },
        render: function () {
            this.$el.find("article").remove();

            _.each(this.collection.models, function (item) {
                this.renderTodo(item);
            }, this);
        },
        renderTodo: function (item) {
            var contactView = new ContactView({
                model: item
            });
            this.$el.append(contactView.render().el);
        },

        getTypes: function () {
            return _.uniq(this.collection.pluck("type"), false, function (type) {
                return type.toLowerCase();
            });
        },

        //выпадающий список
        createSelect: function () {
            var filter = this.$el.find("#filter"),
                select = $("<select/>", {
                    html: "<option value='all'>Все</option>"//значение по-умолчанию
                });
            _.each(this.getTypes(), function (item) {//формирует элемент <select>
                var option = $("<option/>", {
                    value: item.toLowerCase(),
                    text: item.toLowerCase()
                }).appendTo(select);
            });

            return select;
        },


        events: {
            "change #filter select": "setFilter",
            "click #add": "addContact",
        },


        setFilter: function (e) {
            this.filterType = e.currentTarget.value;
            this.trigger("change:filterType");
        },


        filterByType: function () {
            if (this.filterType === "all") {
                this.collection.reset(cosms);//reset-обновление коллекции
                todoRouter.navigate("filter/all");
            } else {
                this.collection.reset(cosms, { silent: true });

                var filterType = this.filterType,
                    filtered = _.filter(this.collection.models, function (item) {
                        return item.get("type").toLowerCase() === filterType;//get-возвращение можеди по типу
                    });

                this.collection.reset(filtered);

                todoRouter.navigate("filter/" + filterType);
            }
        },

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        addContact: function (e) {
            e.preventDefault();

            var formData = {};
            $("#addContact").children("input").each(function (i, el) {
                if ($(el).val() !== "") {
                    formData[el.id] = $(el).val();
                }

            });

            //обновление
            cosms.push(formData);

            //обновление списка
            if (_.indexOf(this.getTypes(), formData.type) === -1) {
                this.collection.add(new Cosm(formData));
                this.$el.find("#filter").find("select").remove().end().append(this.createSelect());
            } else {
                this.collection.add(new Cosm(formData));
            }
        },


        removeContact: function (removedModel) {
            var removed = removedModel.attributes;

            //удаление из массива
            _.each(cosms, function (contact) {
                if (_.isEqual(contact, removed)) {
                    cosms.splice(_.indexOf(cosms, contact), 1);
                }
            });

        },


    });

    //маршрутизация, меняется URL
    var ContactsRouter = Backbone.Router.extend({
        routes: {
            "filter/:type": "urlFilter"
        },

        urlFilter: function (type) {
            directory.filterType = type;
            directory.trigger("change:filterType");
        }
    });

    //создание экземпляра главного представления
    var directory = new DirectoryView();

    //создание объекта маршрутизатора
    var todoRouter = new ContactsRouter();

    //поддержка истории, Backbone будет отслеживать хэш изменения URL
    Backbone.history.start();

} (jQuery));