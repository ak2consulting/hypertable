Hash.implement({
    sort:function(fn){
        var out = [],
        keysToSort = this.getKeys(),
        m = this.getLength();
        (typeof fn == 'function') ? keysToSort.sort(fn) : keysToSort.sort();
        for (var i=0; i<m; i++){
            var o = {};
            o[keysToSort[i]] = this[keysToSort[i]];
            out.push(o);
        }
        return out;
    }
});

function sortNumber(a,b) {
    return a - b;
}

var HTMonitoring = new Class({
    Implements: [Options, Events],
    options: {
        width: 1000,
        height: 220,
        leftEdge: 100,
        topEdge: 10,
        gridWidth: 670,
        gridHeight: 200,
        columns: 60,
        rows: 8,
        gridBorderColour: '#ccc',
        shade: false,
        secureJSON: false,
        httpMethod: 'get',
        axis: "0 0 1 1"
    },

    initialize: function(element,type,stat,time_interval,resolution,options) {
        this.parentElement = element;
        this.setOptions(options);
        this.options.type = type;
        this.options.stat = stat;
        this.options.time_interval = time_interval;
        this.options.start_time = '';
        this.options.end_time = '';
        this.options.sort = 'Name';
        this.options.sort_options = ['Name','Value'];
        this.options.selected_rs = options.selected_rs;
        this.options.resolution = resolution;
        this.chart = '';
        this.buildContainers();
        this.getData(); // calls graphData
    },



    dataURL: function() {
        url = ['data', this.options.type]
        if (this.options.stat)
            url.push(this.options.stat)
        if(this.options.time_interval)
            url.push(this.options.time_interval)
        if(this.options.start_time)
            url.push(this.options.start_time)
        if(this.options.end_time)
            url.push(this.options.end_time)
        if(this.options.sort)
            url.push(this.options.sort)
        if (this.options.resolution)
            url.push(this.options.resolution);
        return url.join('/')
    },

    getData: function() {
        this.request = new Request.JSONP({
            url: this.dataURL(),
            data: this.requestData,
            secure: this.options.secureJSON,
            method: this.options.httpMethod,
            onComplete: function(json) {
                if (this.ajaxImageContainer) {
                    $(this.ajaxImageContainer).dispose();
                }
                this.graphData(json);
            }.bind(this),
            onFailure: function(header, value) {
                if (this.ajaxImageContainer) {
                    $(this.ajaxImageContainer).dispose();
                }
                $(this.parentElement).set('html', header)
            }.bind(this),
        });
        this.buildAjaxLoadImageContainer();
        this.request.send();
    },

    buildGraphHeader: function() {
        header = $chk(this.options.name) ? this.options.name : this.options.plugin
        this.graphHeader = new Element('h3', {
            'class': 'graph-title',
            'align': 'center',
            'html': header
        });
        $(this.graphContainer).grab(this.graphHeader);
    },

    buildGraphContainer: function() {
        $(this.parentElement).set('style', 'padding-top: 1em');
        this.graphContainer = new Element('div', {
            'class': 'graph container',
            'id' : 'graph-container',
            'styles': {
                'margin-bottom': '24px',
                'text-align' : 'center'
            }
        });
        $(this.parentElement).grab(this.graphContainer);
    },

    buildGraphImageContainer: function(divid) {
        this.graphImageContainer = new Element('div', {
            'class': 'graph image container',
            'id' : divid,
            'styles': {
                'margin-bottom': '24x'
            }
        });
    },

    buildAjaxLoadImageContainer: function() {
        ajaxImage = new Element('img',{'src':'/images/ajax-loader.gif'});
        this.ajaxImageContainer = new Element('div', {
            'class': 'graph ajax image container',
            'align': 'center',
            'styles': {
                'margin-bottom': '24x'
            }
        });
        $(this.ajaxImageContainer).grab(ajaxImage);
        $(this.parentElement).grab(this.ajaxImageContainer);
    },

    buildErrorContainer:function() {
        this.errorContainer =  new Element('div', {
            'class': 'warning',
        });
        $(this.parentElement).grab(this.errorContainer,'top');
    },


});

var HTMGraph = new Class({
    Extends: HTMonitoring,
    Implements: Chain,


    // assemble data to graph, then draw it
    graphData: function(data) {
        this.ys        = [];
        this.instances = [];
        this.metrics   = [];
        this.stats = new Hash(data["stats"]);
        this.timescales = new Hash(data["time_intervals"])
        this.type = this.options.type;
        this.stat = this.options.stat;
        this.buildGraphContainer();
        this.buildSelectors();
        google.setOnLoadCallback(this.drawGoogleChart(data));

        if (data['graph']['error'] && data['graph']['error']!='') {
            this.displayError(data['graph']['error']);
        }
    },

    drawGoogleChart: function(gdata) {

        chart_data = gdata['graph']['data'];
        type = this.options.type;

        var gtable = new google.visualization.DataTable();
        gtable.addColumn('string', 'Tables');

        for( stat in gdata['graph']['stats']) {
            gtable.addColumn('number',gdata['graph']['stats'][stat]);
        }

        gtable.addRows(gdata['graph']['size']);
        row = 0;

        for (row=0;row < chart_data.length; row++) {
            column_values = chart_data[row];
            column=0;
            gtable.setValue(row,column,column_values[column]);
            gtable.setValue(row,column+1,column_values[column+1]);
        }


        chart = new google.visualization.BarChart($(this.graphContainer));
        chart.draw(gtable, {width: 900, height: 300,
                            vAxis: {title: gdata['graph']['vaxis']['title'],titleColor: '#73d216'} ,
                            hAxis: {title: gdata['graph']['haxis']['title'], titleColor: '#c17d11'},
                            colors: gdata['graph']['colors'],
                            title: gdata['graph']['title'],

                         });
        google.visualization.events.addListener(chart, 'select', function() {
            if (type == "RangeServer") {
                selection = chart.getSelection();
                row = selection[0].row;
                column = selection[0].column;
                url = ["http:/",window.location.host]
                url.push("graphs?server="+gtable.getValue(row,column-1));
                window.location = url.join("/");
            } else {
                return;
            }
        });
    },



    displayError: function(error) {
        if (this.errorContainer) {
            $(this.errorContainer).dispose();
        }
        this.buildErrorContainer();
        this.errorContainer.set('text',error);
    },

    buildContainers: function() {

        this.formContainer = new Element('div', {
            'class': 'form container',
            'styles': {
                'text-align': 'center',
            }
        });
        $(this.parentElement).grab(this.formContainer, 'top')

        this.sortContainer = new Element('span', {
            'class': 'sort container',
            'styles': {
                'width': '30%',
            }
        });

        this.statContainer = new Element('span',{
            'class': 'stat container',
            'styles': {
                'width': '30%',
            }
        });

        this.timeContainer = new Element('span',{
            'class': 'time container',
            'styles': {
                'width': '30%',
            }
        });

        this.resolutionContainer = new Element('span', {
            'class': 'resolution container',
            'styles': {
                'width': '20%',
            }
        });

        this.submitContainer = new Element('span',{
            'class': 'submit container',
            'styles': {
                'width': '10%',
            }
        });

    },

    validateForm: function() {
        if(this.type == "RangeServer") {
            if (this.options.resolution == "") {
                this.displayError("Please provide valid value for resolution");
                return false;
            }
            if (this.options.resolution != "") {
                var secs = this.options.time_interval * 60;
                var resolution = this.options.resolution * 60;
                var percentage = resolution / secs;
                if (percentage >= 0.75) {
                    this.displayError("Resolution should be less than 75% of duration selected");
                    return false;
                } else if(percentage == 0) {
                    this.displayError("Resolution should be greater than 0");
                    return false;
                }
            }
        }
        return true;
    },

    buildSelectors: function() {
        var container = $(this.formContainer);
        var stat_container = $(this.statContainer);
        var time_container = $(this.timeContainer);
        var submit_container = $(this.submitContainer);
        var sort_container = $(this.sortContainer);
        var resolution_container = $(this.resolutionContainer);

        var form = new Element('form', {
            'action': this.dataURL(),
            'method': 'get',
            'events': {
                'submit': function(e, foo) {

                    e.stop();
                    this.options.stat = $('stat').get('value');
                    this.options.time_interval = $('time_interval').get('value');
                    this.options.sort = $('sort').get('value');
                    if(this.type == "RangeServer") {
                        this.options.resolution = $('resolution').get('value');
                    }
                    if (this.validateForm()) {
                        $(this.timeContainer).empty();
                        $(this.statContainer).empty();
                        $(this.sortContainer).empty();
                        $(this.formContainer).empty();

                        if (this.errorContainer) {
                            $(this.errorContainer).dispose();
                        }
                        if (this.graphContainer) {
                            $(this.graphContainer).dispose();
                        }
                        /* Draw everything again. */
                        this.getData();
                    }
                }.bind(this)
            }
        });

        var stat_select = new Element('select', { 'id': 'stat', 'class': 'date timescale' });
        var selected_stat = this.options.stat;


        this.stats.sort().each(function(element) {
            $each(element,function(name,id) {
                var option = new Element('option', {
                    html: name,
                    value: id,
                    selected: (id == selected_stat ? 'selected' : '')

                });
                stat_select.grab(option)
            });
        });

        var time_select = new Element('select', { 'id':'time_interval','class': 'date timescale' });
        var selected_time = this.options.time_interval;



        this.timescales.sort(sortNumber).each(function(element) {
            $each(element,function(label,hour) {
                var option = new Element('option', {
                    html: label,
                    value: hour,
                    selected: (hour == selected_time ? 'selected' : '')
                });
                time_select.grab(option)
            });
        });

        var selected_sort = this.options.sort;
        var sort_select = new Element('select', { 'id':'sort','class': 'date timescale' });
        this.options.sort_options.each(function(sort) {
            var option = new Element('option', {
                html: sort,
                value: sort,
                selected: (sort == selected_sort ? 'selected' : '')
            });
            sort_select.grab(option);
        });

        var sort_label = new Element('label', {'for':'sort','text':'Sort By: '});
        var stat_label = new Element('label', {'for':'stat','text':'Stat: '});
        var time_label = new Element('label', {'for':'time_select','text':'Duration: '});

        var submit = new Element('input', { 'type': 'submit', 'value': 'show' });
        sort_container.grab(sort_label);
        sort_container.grab(sort_select);
        stat_container.grab(stat_label);
        stat_container.grab(stat_select);
        time_container.grab(time_label);
        time_container.grab(time_select);

        submit_container.grab(submit);
        form.grab(sort_container);
        form.grab(stat_container);
        form.grab(time_container);
        if (this.type == "RangeServer") {
            var resolution_label = new Element('label',{'for':'resolution_select','text':'Resolution (in mins): '});
            this.options.resolution = new Element('input',{'id':'resolution', 'value':this.options.resolution ,'size':'5'});
            resolution_container.grab(resolution_label);
            resolution_container.grab(this.options.resolution);
            form.grab(resolution_container);
        }
        form.grab(submit_container);
        container.grab(form);
    },
});



var RSGraph = new Class({
    Extends: HTMonitoring,
    Implements: Chain,
    // assemble data to graph, then draw it
    graphData: function(data) {
        this.ys        = [];
        this.instances = [];
        this.metrics   = [];
        this.buildGraphContainer();
        this.buildGraphHeader();
        this.data = data;
        if (this.options.selected_rs != "") {
            this.options.stat = this.options.selected_rs;
        }
        if(this.data['servers']) {
            this.servers = new Hash(this.data["servers"]);
            this.buildSelectors();
            this.displayDefaultGraphs();
        } else if (this.data['graph'] && this.data['graph']['error'] && this.data['graph']['error']!='') {
            this.displayError(this.data['graph']['error']);
        }

    },

    displayError: function(error) {
        if (this.errorContainer) {
            $(this.errorContainer).dispose();
        }
        this.buildErrorContainer();
        this.errorContainer.set('text',error);
    },

    // this method is to show the default 1hour graphs for the first server or selected server in the list
    displayDefaultGraphs: function() {
        this.options.type = 'graphs';
        this.options.start_time = $('start_time').get('value');
        this.options.end_time = $('end_time').get('value');

        if (this.options.selected_rs != "") {
            this.options.selected_rs = this.options.stat;
        } else {
            this.options.stat = $('rs').get('value');
        }

        if (this.options.type && this.options.start_time && this.options.end_time && this.options.stat) {
            this.displayGraphInfo();
        }
    },

    displayGraphInfo: function() {
        this.buildGraphContainer();
        this.buildGraphHeader();
        selected_server = this.servers.get(this.options.stat);
        if ( selected_server != this.options.stat) {
            selected_server = this.options.stat + " (" + selected_server + ")";
        }
        this.graphHeader.set('text',"RRD Graphs for "+selected_server);
        for (i=0; i < this.data['stats'].length; i++) {
            key = this.data['stats'][i];
            this.buildGraphImageContainer();
            url = this.buildGraphImageUrl(key);
            img = new Element('img', {'src':url,'height':360,'width':1000});
            $(this.graphImageContainer).grab(img);
            $(this.graphContainer).grab(this.graphImageContainer);
        }
    },

    buildGraphImageUrl: function(key) {
        url = ['/graph'];
        url.push(this.options.stat);
        url.push(key);
        url.push(this.options.start_time);
        url.push(this.options.end_time);
        return url.join('/');
    },

    buildContainers: function() {

        this.rsContainer = new Element('div', {
            'class': 'rs container',
            'styles': {
                'text-align' : 'center',
            }
        });
        $(this.parentElement).grab(this.rsContainer, 'top')

        this.serverContainer = new Element('span',{
            'class': 'server container',
            'styles': {
                'width': '30%',
            }
        });

        this.startContainer = new Element('span',{
            'class': 'start container',
            'styles': {
                'width': '30%',
            }
        });

        this.endContainer = new Element('span',{
            'class': 'end container',
            'styles': {
                'width': '30%',
            }
        });

        this.submitContainer = new Element('span',{
            'class': 'submit container',
            'styles': {
                'width': '10%',
            }
        });

    },

    validate: function(start_date,end_date) {
        if (start_date == "" || end_date == "") {
            this.displayError("Please provide both start date and end date");
            return false;
        } else if(start_date >= end_date) {
            this.displayError("Start Date should be less than End Date");
            return false;
        }
        return true;
    },

    buildSelectors: function() {
        var rs_container = $(this.rsContainer);
        var start_container = $(this.startContainer);
        var end_container = $(this.endContainer);
        var submit_container = $(this.submitContainer);
        var server_container = $(this.serverContainer);
        var form = new Element('form', {
            'action': this.dataURL(),
            'method': 'get',
            'events': {
                'submit': function(e, foo) {
                    e.stop();
                    this.options.type = 'graphs';
                    this.options.start_time = $('start_time').get('value');
                    this.options.end_time = $('end_time').get('value');
                    this.options.stat = $('rs').get('value');
                    this.options.sort = '';
                    if (this.validate(this.options.start_time,this.options.end_time)) {
                        if (this.errorContainer) {
                            $(this.errorContainer).dispose();
                        }
                        if (this.graphContainer) {
                            $(this.graphContainer).dispose();
                        }
                        this.displayGraphInfo();
                    }
                }.bind(this)
            }
        });

        var rs_select = new Element('select', { 'id': 'rs', 'class': 'rs' });
        var selected_rs = this.options.stat;

        this.servers.sort().each(function(element) {
            $each(element, function(name,id) {
                var option = new Element('option', {
                    html: name,
                    value: id,
                    selected: (id == selected_rs ? 'selected' : '')

                });
                rs_select.grab(option)
            });
        });

        now = new Date();
        end_date = parseInt(now.getTime()/1000);
        start_date = end_date - 3600;


        var rs_label = new Element('label', {'for':'rs','text':'Range Servers: '});
        var starttime_label = new Element('label', {'for':'start_time','text':'Start Time: '});
        var endtime_label = new Element('label', {'for':'end_time','text':'End Time: '});

        var starttime_select = new Element('input', { 'id':'start_time','class': 'date start_time','type':'text','value':start_date});
        var endtime_select = new Element('input' , { 'id':'end_time','class':'date end_time','type':'text','value':end_date});

        var submit = new Element('input', { 'type': 'submit', 'value': 'show' });

        server_container.grab(rs_label);
        server_container.grab(rs_select);

        start_container.grab(starttime_label);
        start_container.grab(starttime_select);

        end_container.grab(endtime_label);
        end_container.grab(endtime_select);

        submit_container.grab(submit);

        form.grab(server_container);
        form.grab(start_container);
        form.grab(end_container);
        form.grab(submit_container);

        rs_container.grab(form);

        new DatePicker('.start_time', { pickerClass: 'datepicker_dashboard', timePicker: true, format: 'm-d-Y @ H:i' });
        new DatePicker('.end_time', { pickerClass: 'datepicker_dashboard', timePicker: true, format: 'm-d-Y @ H:i' });
    },
});
