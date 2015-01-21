var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var urls = require('url');

var baseUrl = 'http://www.paninicomics.it/web/guest/checklist',
	pages = [baseUrl],
	comics = [];

step();




function step() {
	var page = pages.shift()
		url = page && page.url || page;

	if (!page) {
		console.log('Saving file comics.json');
		fs.writeFile('comics.json', JSON.stringify(comics), function(err) {
			if (err)
				console.error('Error saving file comics.json', err);
			else
				console.log('File comics.json saved succesfully');
		});
	} else {
		console.log('loading page', url);

		request(page, function(error, response, html) {
			if (error || response.statusCode != 200) {
				console.error(error, 'status:', response);
				return;
			}

			var $ = cheerio.load(html);
			$('.result').each(function(i) {
				var $item = $(this),
					$cover = $item.find('.cover img');

				comics.push({
					title: $cover.attr('alt'),
					cover: urls.resolve(url, $cover.attr('src')),
					outDate: $item.find('.desc h3').first().text(),
					price: $item.find('.price strong').text(),
					publisher: $item.find('.logo_brand img').attr('alt'),
					subtitle: $item.find('.subtitle').text(),
					itemUrl: urls.resolve(url, $item.find('a.detail').attr('href'))
				});
			});

			
			var nextPage = $('.more .current').next().text();
			if (nextPage && nextPage.match(/^\d+$/)) {
				var $form = $('[name="displayItemSearchFilterForm"]');
				$form.find('[name="pager.offset"]').val(((+nextPage)-1)*20);

				var page = {
					url: $form.attr('action'),
					method: 'POST',
					form: {}
				};

				$form.find('input').each(function() {
					var $this = $(this);
					page.form[$this.attr('name')] = $this.val();
				});

				pages.push(page);
			}

			step();
		});
	}
}