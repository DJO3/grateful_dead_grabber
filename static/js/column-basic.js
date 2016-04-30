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
$('#pie_drilldown').on("click", function() {
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

$('#modal-id').on('hidden.bs.modal', function () {
    $('#container').empty();
    $('#ordinal-selector').show();
});