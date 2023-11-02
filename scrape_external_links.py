# scrape_external_links.py

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import json
import sys

def is_valid_url(url):
    parsed = urlparse(url)
    return bool(parsed.netloc) and bool(parsed.scheme)

def get_external_links(url):
    external_links = []
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        for a_tag in soup.findAll('a', href=True):
            href = a_tag.attrs['href']
            if is_valid_url(href) and not href.startswith(url):
                external_links.append(href)
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

    return external_links

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else exit('No URL provided')
    links = get_external_links(url)
    print(json.dumps(links))
