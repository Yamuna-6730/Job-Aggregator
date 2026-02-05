# import requests

# url = "https://api.firecrawl.dev/v2/scrape"

# payload = {
#   "url": "https://in.indeed.com/viewjob?jk=580826eeea8e5ebd",
#   "onlyMainContent": False,
#   "maxAge": 172800000,
#   "parsers": [
#     "pdf"
#   ],
#   "formats": [
#     "markdown"
#   ],
#   "waitFor": 3000
# }

# headers = {
#     "Authorization": "Bearer fc-66f8af9cd9b349848648d3abb89e8f57",
#     "Content-Type": "application/json"
# }

# response = requests.post(url, json=payload, headers=headers)

# print(response.json())

# pip install firecrawl-py

import os
from firecrawl import Firecrawl

firecrawl = Firecrawl(api_key="fc-66f8af9cd9b349848648d3abb89e8f57")

doc = firecrawl.scrape("https://www.linkedin.com/jobs/view/4365685012/",wait_for=10000,formats=["markdown"])

print(doc.markdown)