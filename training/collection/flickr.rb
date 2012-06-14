require 'rubygems'
require 'open-uri'
require 'flickraw'

FlickRaw.api_key="0cc11cffc8a238efef4dfa6dca255a44"
FlickRaw.shared_secret="5f76a97053f99673"

$count = 0

$fetched = Hash.new

def getPage(page)
  list = flickr.photos.getRecent :per_page => 500, :page => page

  list.each do |photo|
    url = "http://farm#{photo.farm}.staticflickr.com/#{photo.server}/#{photo.id}_#{photo.secret}_c.jpg"

    if $fetched[url] != 1
      $fetched[url] = 1

      name = rand(100000000000)

      file = "NEGS_FLICKR/#{name}.jpg"

      puts file

      open(file, 'wb') do |file|
        file << open(url).read
      end
      puts "saved to #{file}"
      $count+=1
    end
  end
end

120.times do |i|
  getPage(i)
end