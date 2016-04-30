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
    $(this).ClassyWiggle('start', {limit: 3});
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

$('#modal-id').on('hidden.bs.modal', function () {
    $('#container').empty();
});