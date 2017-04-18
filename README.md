# tusktowall
Arranges images from a Mastodon instance into a wall.

Nothing fancy. Just something for me to learn some front-end development. I've never done any front-end code before! :P

Polls the given Mastodon instance for toots using the [Mastodon /timelines API](https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#timelines). If the toot has an image, it's added to the wall and all images are re-arranged.

Uses [Isotope](http://isotope.metafizzy.co/) for the layout library.

## Query Params:
* [optional] instance = \<Mastodon instance domain\>
	* default: "mastodon.social"
* [optional] local = [true | false]
	* default: true
* [optional] isVisibleNSFW = [true | false]
	* default: false
