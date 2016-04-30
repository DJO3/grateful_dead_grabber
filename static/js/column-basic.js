init();

// Site initialization
function init() {
    getArtists(populateArtistsDropdown);
}

// Default artists
function defaultArtists() {
    return ['grateful-dead', 'allman-brothers', 'dave-matthews-band'];
}

// Load column-basic chart on click, wiggle briefly on mouseenter
$('#column-basic').on("click", function() {
    $(this).ClassyWiggle('stop');
    var defaultSelector = 'month';
    var artists = getCheckedArtists();
    console.log(artists);
    $('#modal-id').modal('show');

    getSeries(artists, defaultSelector, function(categories, series) {
        columnBasic(categories, series);
    });
}).on("mouseenter", function() {
    $(this).ClassyWiggle('start', {limit: 2});
}).on("mouseleave", function() {
    $(this).ClassyWiggle('stop');
});

// Load pie-drildown chart on click, wiggle briefly on mouseenter
$('#pie-drilldown').on("click", function() {
    $(this).ClassyWiggle('stop');
    // var defaultSelector = 'month';
    // var artists = getCheckedArtists();
    // console.log(artists);
    $('#ordinal-selector').hide();
    $('#modal-id').modal('show');
    //
    // getSeries(artists, defaultSelector, function(categories, series) {
    //     columnBasic(categories, series);
    // });
    pieDrillDown();
}).on("mouseenter", function() {
    $(this).ClassyWiggle('start', {limit: 2});
}).on("mouseleave", function() {
    $(this).ClassyWiggle('stop');
});

// Load pie-drildown chart on click, wiggle briefly on mouseenter
$('#basic-line').on("click", function() {
    $(this).ClassyWiggle('stop');
    // var defaultSelector = 'month';
    // var artists = getCheckedArtists();
    // console.log(artists);
    $('#ordinal-selector').hide();
    $('#modal-id').modal('show');
    //
    // getSeries(artists, defaultSelector, function(categories, series) {
    //     columnBasic(categories, series);
    // });
    basicLine();
}).on("mouseenter", function() {
    $(this).ClassyWiggle('start', {limit: 2});
}).on("mouseleave", function() {
    $(this).ClassyWiggle('stop');
});

// Change chart x-axis based on day/month/year on click
$('.modal-title div button').on("click", function() {
    var selector = this.textContent.toLowerCase();
    var artists = getCheckedArtists();

    getSeries(artists, selector, function(categories, series) {
        columnBasic(categories, series);
    });
});

// Convert user input to a slug
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Returns all available artists
function getArtists (callback) {
    var url = 'http://api.localhost:5000/v1/artists';
    $.ajax({
        url: url,
        success: function (results) {
            callback(results.data)
        }
    })
}

// Appends artists to artists dropdown
function populateArtistsDropdown(artists) {
    var dropdown = $('#artists-list');
    artists.forEach(function (artist) {
        dropdown.append('<li><a href="#"><input type="checkbox" id="'+artist+'">'+artist+'</a></li>')
        dropdown.append('<li role="separator" class="divider"></li>')
    });
}

// Returns an array of all selected artists in artists dropdown
function getCheckedArtists() {
    var artists = $('input:checkbox:checked').map(function() {
        return this.id;
    });

    if (artists.length === 0) {
        artists = defaultArtists();
    }

    return artists
}

// Asynchronously get monthly show stats. Accepts array of artists and selector string 'day', 'month', 'year'
function getSeries (artists, selector, callback) {
    series = [];
    categories = [];

    // Get shows for each artist
    for (var i = 0; i < artists.length; i++) {
        var url = 'http://api.localhost:5000/v1/shows/' + artists[i] + '?count=' + selector;
        $.ajax({
            url: url,
            indexValue: i,
            success: function (result) {

                // Build Highcharts data object - requires name(string) and data(array)
                var name = artists[this.indexValue];
                var raw_data = result.data.count;
                series.push({"name": name, "raw_data": raw_data, "data": []});

                // Merge all artist categories for use in x-axis
                categories = categories.concat(result.data.count.keys);

                // All AJAX calls have completed - align data to x-axis
                if (series.length === artists.length) {

                    // Remove duplicates from x-axis
                    categories = (categories.filter(function(item, i, ar){ return ar.indexOf(item) === i; })).sort();

                    // If artist has category, add it to data, otherwise add a 0.
                    series.forEach(function (artist) {
                        categories.forEach(function (category) {
                            if (artist.raw_data[category]) {
                                artist['data'].push(artist.raw_data[category])
                            } else {
                                artist['data'].push('0')
                            }
                        })
                    });

                    // Month is special, label x-axis with months instead of numbers if desired
                    if (selector === 'month') {
                        categories = [
                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                        ];
                    }

                    // Load chart
                    callback(categories, series)
                }
            }
        });
    }
}

// Loads column-basic chart in modal
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

// Loads drilldown pie chart
function pieDrillDown() {
    $('#container').highcharts({
        chart: {
            type: 'pie'
        },
        title: {
            text: 'Shows by Country'
        },
        subtitle: {
            text: 'Click the slices to view states. Source: Setlist.fm'
        },
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '{point.name}: {point.y}%'
                }
            }
        },

        tooltip: {
            headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
            pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}%</b> of total<br/>'
        },
        series: [{
            name: 'Brands',
            colorByPoint: true,
            data: [{
                name: 'Microsoft Internet Explorer',
                y: 56.33,
                drilldown: 'Microsoft Internet Explorer'
            }, {
                name: 'Chrome',
                y: 24.03,
                drilldown: 'Chrome'
            }, {
                name: 'Firefox',
                y: 10.38,
                drilldown: 'Firefox'
            }, {
                name: 'Safari',
                y: 4.77,
                drilldown: 'Safari'
            }, {
                name: 'Opera',
                y: 0.91,
                drilldown: 'Opera'
            }, {
                name: 'Proprietary or Undetectable',
                y: 0.2,
                drilldown: null
            }]
        }],
        drilldown: {
            series: [{
                name: 'Microsoft Internet Explorer',
                id: 'Microsoft Internet Explorer',
                data: [
                    ['v11.0', 24.13],
                    ['v8.0', 17.2],
                    ['v9.0', 8.11],
                    ['v10.0', 5.33],
                    ['v6.0', 1.06],
                    ['v7.0', 0.5]
                ]
            }, {
                name: 'Chrome',
                id: 'Chrome',
                data: [
                    ['v40.0', 5],
                    ['v41.0', 4.32],
                    ['v42.0', 3.68],
                    ['v39.0', 2.96],
                    ['v36.0', 2.53],
                    ['v43.0', 1.45],
                    ['v31.0', 1.24],
                    ['v35.0', 0.85],
                    ['v38.0', 0.6],
                    ['v32.0', 0.55],
                    ['v37.0', 0.38],
                    ['v33.0', 0.19],
                    ['v34.0', 0.14],
                    ['v30.0', 0.14]
                ]
            }, {
                name: 'Firefox',
                id: 'Firefox',
                data: [
                    ['v35', 2.76],
                    ['v36', 2.32],
                    ['v37', 2.31],
                    ['v34', 1.27],
                    ['v38', 1.02],
                    ['v31', 0.33],
                    ['v33', 0.22],
                    ['v32', 0.15]
                ]
            }, {
                name: 'Safari',
                id: 'Safari',
                data: [
                    ['v8.0', 2.56],
                    ['v7.1', 0.77],
                    ['v5.1', 0.42],
                    ['v5.0', 0.3],
                    ['v6.1', 0.29],
                    ['v7.0', 0.26],
                    ['v6.2', 0.17]
                ]
            }, {
                name: 'Opera',
                id: 'Opera',
                data: [
                    ['v12.x', 0.34],
                    ['v28', 0.24],
                    ['v27', 0.17],
                    ['v29', 0.16]
                ]
            }]
        }
    });
}

// Loads basicLine chart
function basicLine() {
    $('#container').highcharts({
        title: {
            text: 'Average Number of Songs Played Per Show',
            x: -20 //center
        },
        subtitle: {
            text: 'Source: Setlist.fm',
            x: -20
        },
        xAxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },
        yAxis: {
            title: {
                text: 'Temperature (°C)'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {
            valueSuffix: '°C'
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        series: [{
            name: 'Tokyo',
            data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
        }, {
            name: 'New York',
            data: [-0.2, 0.8, 5.7, 11.3, 17.0, 22.0, 24.8, 24.1, 20.1, 14.1, 8.6, 2.5]
        }, {
            name: 'Berlin',
            data: [-0.9, 0.6, 3.5, 8.4, 13.5, 17.0, 18.6, 17.9, 14.3, 9.0, 3.9, 1.0]
        }, {
            name: 'London',
            data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
        }]
    });
}

$('#modal-id').on('hidden.bs.modal', function () {
    $('#container').empty();
    $('#ordinal-selector').show();
});