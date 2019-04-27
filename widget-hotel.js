function hotelWidget(city, checkInDate, checkOutDate, guests, rooms) {
    return `https://www.clicktripz.com/api/widget/v1/hotel-citywide?publisherID=4&obj=a&optMaxChecked=2&optMaxAdvertisers=7&optTabbedMode=1&userForcedTabbedMode=1&optRotationStrategy=1&optPopUnder=1&referralURL=http%3A%2F%2Fwww.travbuddy.com%2Ftest.php%3Fcity%3DLong%20Beach%2C%20CA&guests=${guests}&rooms=${rooms}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&city=${city}`
}

function tabUrl({checkedCampaigns, uncheckedCampaigns, searchKey, city, checkInDate, checkOutDate, guests, rooms}) {
    return `https://www.clicktripz.com/rates/search/index.php?city=${city}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&rooms=${rooms}&guests=${guests}&publisherID=4&referralURL=http%3A%2F%2Fwww.travbuddy.com%2Ftest.php%3Fcity%3DLong%20Beach%2C%20CA&type=1&baseURL=https%3A%2F%2Fwww.clicktripz.com&${checkedCampaigns}&${uncheckedCampaigns}&hostname=www.clicktripz.com&isPopUnder=true&searchKey=${searchKey}&auctionType=100&productType=exit_unit&maxSearchesPerDay=86400&hardLimitSearchCap=9999&hardLimitSearchCapSeconds=1&searchDisplayType=4`
}

module.exports = {
    hotelWidget,
    tabUrl
}