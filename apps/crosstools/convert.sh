for i in `find ../../../nyt_crosswords -name *.json | head 500`; do ./convertft.js $i > "../../data/crosswords/$(echo $i | sed -e 's;\.\./;;g' -e 's;/;_;g')" ; done
