init();

function init() {
    getSeries(['grateful-dead', 'allman-brothers', 'dave-matthews-band'], 'month', function(categories, series) {
        columnBasic(categories, series);
    });
}

// Asynchronously get monthly show stats. Accepts array of artists and selector string 'day', 'month', 'year'
function getSeries (artists, selector, callback) {
    series = [];
    for (var i = 0; i < artists.length; i++) {
        var url = '/api/v1/shows/' + artists[i] + '?count=' + selector;
        var ajaxData = $.ajax({
            url: url,
            indexValue: i,
            success: function (result) {
                var name = artists[this.indexValue];
                var data = result.data.count.values;
                series.push({"name": name, "data": data});

                if (series.length === artists.length) {
                    if (selector === 'month') {
                        categories = [
                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                        ];
                    } else {
                        categories = result.data.count.keys;
                    }
                    callback(categories, series)
                }
            }
        });
    }
}

function columnBasic(categories, series) {
    $('#container').highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: 'Total Shows Performed'
        },
        subtitle: {
            text: 'Source: Setlist.fm'
        },
        xAxis: {
            categories: categories,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number of shows'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y} shows</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: series
    });
}