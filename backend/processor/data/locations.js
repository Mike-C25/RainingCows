var NOAA_ID = [
	{
		"name": "Alabama",
		"id": "FIPS:01"
	},
	{
		"name": "Alaska",
		"id": "FIPS:02"
	},
	{
		"name": "Arizona",
		"id": "FIPS:04"
	},
	{
		"name": "Arkansas",
		"id": "FIPS:05"
	},
	{
		"name": "California",
		"id": "FIPS:06"
	},
	{
		"name": "Colorado",
		"id": "FIPS:08"
	},
	{
		"name": "Connecticut",
		"id": "FIPS:09"
	},
	{
		"name": "Delaware",
		"id": "FIPS:10"
	},
	{
		"name": "District of Columbia",
		"id": "FIPS:11"
	},
	{
		"name": "Florida",
		"id": "FIPS:12"
	},
	{
		"name": "Georgia",
		"id": "FIPS:13"
	},
	{
		"name": "Hawaii",
		"id": "FIPS:15"
	},
	{
		"name": "Idaho",
		"id": "FIPS:16"
	},
	{
		"name": "Illinois",
		"id": "FIPS:17"
	},
	{
		"name": "Indiana",
		"id": "FIPS:18"
	},
	{
		"name": "Iowa",
		"id": "FIPS:19"
	},
	{
		"name": "Kansas",
		"id": "FIPS:20"
	},
	{
		"name": "Kentucky",
		"id": "FIPS:21"
	},
	{
		"name": "Louisiana",
		"id": "FIPS:22"
	},
	{
		"name": "Maine",
		"id": "FIPS:23"
	},
	{
		"name": "Maryland",
		"id": "FIPS:24"
	},
	{
		"name": "Massachusetts",
		"id": "FIPS:25"
	},
	{
		"name": "Michigan",
		"id": "FIPS:26"
	},
	{
		"name": "Minnesota",
		"id": "FIPS:27"
	},
	{
		"name": "Mississippi",
		"id": "FIPS:28"
	},
	{
		"name": "Missouri",
		"id": "FIPS:29"
	},
	{
		"name": "Montana",
		"id": "FIPS:30"
	},
	{
		"name": "Nebraska",
		"id": "FIPS:31"
	},
	{
		"name": "Nevada",
		"id": "FIPS:32"
	},
	{
		"name": "New Hampshire",
		"id": "FIPS:33"
	},
	{
		"name": "New Jersey",
		"id": "FIPS:34"
	},
	{
		"name": "New Mexico",
		"id": "FIPS:35"
	},
	{
		"name": "New York",
		"id": "FIPS:36"
	},
	{
		"name": "North Carolina",
		
		"id": "FIPS:37"
	},
	{
		"name": "North Dakota",
		"id": "FIPS:38"
	},
	{
		"name": "Ohio",
		"id": "FIPS:39"
	},
	{
		"name": "Oklahoma",
		"id": "FIPS:40"
	},
	{
		"name": "Oregon",
		"id": "FIPS:41"
	},
	{
		"name": "Pennsylvania",
		"id": "FIPS:42"
	},
	{
		"name": "Rhode Island",
		"id": "FIPS:44"
	},
	{
		"name": "South Carolina",
		"id": "FIPS:45"
	},
	{
		"name": "South Dakota",
		"id": "FIPS:46"
	},
	{
		"name": "Tennessee",
		"id": "FIPS:47"
	},
	{
		"name": "Texas",
		"id": "FIPS:48"
	},
	{
		"name": "Utah",
		"id": "FIPS:49"
	},
	{
		"name": "Vermont",
		"id": "FIPS:50"
	},
	{
		"name": "Virginia",
		"id": "FIPS:51"
	},
	{
		"name": "Washington",
		"id": "FIPS:53"
	},
	{

		"name": "West Virginia",
		"id": "FIPS:54"
	},
	{
		"name": "Wisconsin",
		"id": "FIPS:55"
	},
	{
		"name": "Wyoming",
		"id": "FIPS:56"
	}
]

var regions = {
    "New England": [
        "Connecticut",
        "Maine",
        "Massachusetts",
        "New Hampshire",
        "Rhode Island",
        "Vermont"
    ],
    "Mid Atlantic": [
        "Delaware",
        "Maryland",
        "New Jersey",
        "New York",
        "Pennsylvania"
    ],
    "South": [
        "Alabama",
        "Arkansas",
        "Florida",
        "Georgia",
        "Kentucky",
        "Louisiana",
        "Mississippi",
        "Missouri",
        "North Carolina",
        "South Carolina",
        "Tennessee",
        "Virginia",
        "West Virginia"
    ],
    "Midwest": [
        "Illinois",
        "Indiana",
        "Iowa",
        "Kansas",
        "Michigan",
        "Minnesota",
        "Nebraska",
        "North Dakota",
        "Ohio",
        "South Dakota",
        "Wisconsin"
    ],
    "Southwest": [
        "Arizona",
        "New Mexico",
        "Oklahoma",
        "Texas"
    ],
    "West": [
        "Alaska",
        "California",
        "Colorado",
        "Hawaii",
        "Idaho",
        "Montana",
        "Nevada",
        "Oregon",
        "Utah",
        "Washington",
        "Wyoming"

    ]
};

exports = module.exports = {
    'NOAA_ID': NOAA_ID,
    'REGIONS': regions
};