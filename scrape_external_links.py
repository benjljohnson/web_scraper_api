# scrape_external_links.py

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import json
import sys

def is_external(url, base_domain):
    """Check if the URL is external by comparing domains."""
    parsed = urlparse(url)
    return bool(parsed.netloc) and parsed.netloc != base_domain

def get_external_links(url):
    external_links = []
    try:
        # Parse the base URL to obtain the domain
        base_domain = urlparse(url).netloc
        
        # Set a user-agent to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        for a_tag in soup.find_all('a', href=True):
            href = a_tag.attrs['href']
            if is_external(href, base_domain):
                external_links.append(href)
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

    return external_links

if __name__ == "__main__":
    if len(sys.argv) <= 1:
        print('No URL provided')
        sys.exit(1)
    
    url = sys.argv[1]
    links = get_external_links(url)
    print(json.dumps(links, indent=2))
