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
    var defaultSelector = 'month';
    var artists = getCheckedArtists();
    console.log(artists);
    $('#modal-id').modal('show');

    getSeries(artists, defaultSelector, function(categories, series) {
        columnBasic(categories, series);
    });
}).on("mouseenter", function() {
    $(this).animate({marginTop: '-=10px'}, 0);
}).on("mouseleave", function() {
    $(this).animate({marginTop: '+=10px'}, 0);
});

// Load pie-drildown chart on click, wiggle briefly on mouseenter
$('#pie-drilldown').on("click", function() {
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
    $(this).animate({marginTop: '-=10px'}, 0);
}).on("mouseleave", function() {
    $(this).animate({marginTop: '+=10px'}, 0);
});

// Load pie-drildown chart on click, wiggle briefly on mouseenter
$('#basic-line').on("click", function() {
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
    $(this).animate({marginTop: '-=10px'}, 0);
}).on("mouseleave", function() {
    $(this).animate({marginTop: '+=10px'}, 0);
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
    var url = 'http://api.setlist.visualizer/v1/artists';
    $.ajax({
        url: url,
        success: function (results) {
            callback(results.data)
        }
    })
}

// Appends artists to artists dropdown
function populateArtistsDropdown(artists) {

    // Populate datalist with artists
    var dropdown = $('#artists-datalist');
    artists.forEach(function (artist) {
        dropdown.append('<option value="'+artist+'" class="artist-datalist"></option>');
    });

    // Add selected artists to #artists-list
    $("#artist-datalist-input").on('input', function () {
        var val = this.value;
        if ($('.artist-datalist').filter(function(){
            return this.value === val;
        }).length) {
            if (! document.getElementById(val)) {
                $('#artists-list').append('<div id="'+val+'" class="list-group-item active"><a href="#">'+val+'</a></div>');
            }

            // Add and remove active class
            $('.list-group-item').unbind("click").on("click", function() {
                if ($(this).hasClass("active")) {
                    $(this).removeClass("active");
                } else {
                    $(this).addClass("active");
                }
            });
        }
    });
}

// Returns an array of all selected artists in artists
function getCheckedArtists() {
    var artists = $('div .active.list-group-item').map(function() {
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
        var url = 'http://api.setlist.visualizer/v1/shows/' + artists[i] + '?count=' + selector;
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

// Loads drilldown pie chart  - currently hardcoded as proof of concept
function pieDrillDown() {
    $('#container').highcharts({
        chart: {
            type: 'pie'
        },
        title: {
            text: 'Shows by Country and City'
        },
        subtitle: {
            text: 'Click the slices to view cities. Source: Setlist.fm'
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
            name: 'Country',
            colorByPoint: true,
            data: [{
                name: 'United States',
                y: 56.33,
                drilldown: 'United States'
            }, {
                name: 'Egypt',
                y: 24.03,
                drilldown: 'Egypt'
            }, {
                name: 'Germany',
                y: 10.38,
                drilldown: 'Germany'
            }, {
                name: 'Canada',
                y: 09.26,
                drilldown: 'Canada'
            }]
        }],
        drilldown: {
            series: [{
                name: 'united-states',
                id: 'United States',
                data: [
                    ['San Francisco', 24.13],
                    ['Oakland', 17.2],
                    ['Seattle', 8.11],
                    ['Boston', 5.33],
                    ['Denver', 1.06]
                ]
            }, {
                name: 'egypt',
                id: 'Egypt',
                data: [
                    ['Cairo', 24.13],
                    ['Alexandria', 17.2],
                    ['Giza', 8.11],
                    ['Suez', 5.33],
                    ['Luxor', 1.06]
                ]
            }, {
                name: 'germany',
                id: 'Germany',
                data: [
                    ['Berlin', 24.13],
                    ['Hamburg', 17.2],
                    ['Munich', 8.11],
                    ['Cologne', 5.33],
                    ['Frankfurt', 1.06]
                ]
            }, {
                name: 'canada',
                id: 'Canada',
                data: [
                    ['Toronto', 24.13],
                    ['Halifax', 17.2],
                    ['Ottawa', 8.11],
                    ['Edmonton', 5.33],
                    ['Vancouver', 1.06]
                ]
            }]
        }
    });
}

// Loads basicLine chart - currently hardcoded as proof of concept
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
                text: 'Shows'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        series: [{
            name: 'grateful-dead',
            data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
        }, {
            name: 'allman-brothers',
            data: [-0.2, 0.8, 5.7, 11.3, 17.0, 22.0, 24.8, 24.1, 20.1, 14.1, 8.6, 2.5]
        }, {
            name: 'dave-matthews-band',
            data: [-0.9, 0.6, 3.5, 8.4, 13.5, 17.0, 18.6, 17.9, 14.3, 9.0, 3.9, 1.0]
        }, {
            name: 'phish',
            data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
        }]
    });
}

$('#modal-id').on('hidden.bs.modal', function () {
    $('#container').empty();
    $('#ordinal-selector').show();
});