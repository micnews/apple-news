# Apple News API client

API wrapper module for Apple News API https://developer.apple.com/library/ios/documentation/General/Conceptual/News_API_Ref/index.html

Supports creating, reading, updating, deleting, and searching articles.
Also supports reading and listing sections, as well as reading channels!

**For Node versions < 4, use `apple-news@^1`. For Node versions >= 4 use `apple-news@^2`. For Node versions >= 6 use `apple-news@^3`**

## Install

```
npm install apple-news --save
```

## Usage

```js
var client = createClient({
  apiId: '<API-ID>',
  apiSecret: '<API-SECRET>'
});
```

## Methods

```
client.readChannel ({ channelId }, cb)
client.listSections ({ channelId }, cb)
client.readSection ({ sectionId }, cb)
client.createArticle ({ channelId, article, bundleFiles, isPreview = true }, cb)
client.readArticle ({ articleId }, cb)
client.updateArticle ({ articleId, revision, article, isPreview = true }, cb)
client.deleteArticle ({ articleId }, cb)
```

## License

MIT
