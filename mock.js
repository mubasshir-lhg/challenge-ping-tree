module.exports=[
    {
        "id": "1",
        "url": "http://example.1.com",
        "value": 0.4,
        "maxAcceptsPerDay": 1,
        "accept": {
            "geoState": {
                "$in": ["ca","ny"]
            },
              "hour": {
                "$in": [ 13,14,15,16]
              }
        }
    },
    {
        "id": "2",
        "url": "http://example.2.com",
        "value": 0.4,
        "maxAcceptsPerDay": 2,
        "accept": {
            "geoState": {
                "$in": ["ca","ny"]
            },
              "hour": {
                "$in": [ 13,14,15,16]
              }
        }
    }
]