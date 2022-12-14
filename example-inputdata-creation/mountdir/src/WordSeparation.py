#! /usr/bin/env python3
"""
WordSeparation.py COPYRIGHT FUJITSU LIMITED 2021
"""
# -*- coding: utf-8 -*-

import argparse
import os
import json

import re
import string
import MeCab
import unicodedata
import numpy as np
from bs4 import BeautifulSoup

def word_separation(txt_file, txt_preprocessed_file):

    ########## Cleaning ##########
    # Remove HTML and XML tags
    with open(txt_file, encoding="utf_8") as f:
        text = f.read()

    soup = BeautifulSoup(text, "html.parser")
    text = soup.get_text(strip=True)


    ########## Character expression normalization ##########
    txt = unicodedata.normalize("NFKC", text) # Replace double-byte symbols with single-byte characters
    txt = txt.lower()


    ########## Word separation ##########
    word = [] # terms in text (duplicates OK)
    tagger = MeCab.Tagger("")
    tagger.parse("")
    count = 0
    for segment in txt.split("\n"):
        node = tagger.parseToNode(segment)
        if (count % 1000) == 0:
            print(str(count) + ":" + segment[:32])
        count += 1
        while node:
            word.append(node.surface)
            node = node.next

    m = map(str, word)
    txt_wakati = ' '.join(m)


    ########## Other preprocessings ##########
    # Separate each sentence with a newline, excluding punctuation, such as & punctuation
    txt_wakati_preprocessed = re.sub(r'^<[^>]*>\s*$', '', txt_wakati, flags=re.MULTILINE)
    table = str.maketrans("", "", string.punctuation+"「」"+"、"+"《"+"》"+"『"+"』"+"・"+"■")
    txt_wakati_preprocessed = txt_wakati_preprocessed.translate(table)
    txt_wakati_preprocessed = re.sub(r'\d', '', txt_wakati_preprocessed, flags=re.MULTILINE)
    txt_wakati_preprocessed = re.sub(r' +', ' ', txt_wakati_preprocessed, flags=re.MULTILINE)
    txt_wakati_preprocessed = re.sub(r'。', r'\n', txt_wakati_preprocessed, flags=re.MULTILINE)
    txt_wakati_preprocessed = re.sub(r' $', '', txt_wakati_preprocessed, flags=re.MULTILINE)
    txt_wakati_preprocessed = re.sub(r'^ +', '', txt_wakati_preprocessed, flags=re.MULTILINE)
    txt_wakati_preprocessed = re.sub(r'^\n', '', txt_wakati_preprocessed, flags=re.MULTILINE)
    txt_wakati_preprocessed = re.sub(r' +', ' ', txt_wakati_preprocessed, flags=re.MULTILINE)

    with open(txt_preprocessed_file, mode='a', errors='ignore', encoding='utf-8') as f:
        f.write(txt_wakati_preprocessed)


def check_arg(args, config):
    endslist = [".txt"]
    if not len(args.input) == len(endslist):
        print("invalid input file(s)")
        return False
    if not all(map(lambda x: x[1].endswith(endslist[x[0]]), enumerate(args.input))):
        print("invalid input file type")
        return False
    endslist = [".txt"]
    if not len(args.output) == len(endslist):
        print("invalid output file(s)")
        return False
    if not all(map(lambda x: x[1].endswith(endslist[x[0]]), enumerate(args.output))):
        print("invalid output file type")
        return False
    return True

def main(args, config):
    txt_file = args.input[0]
    txt_preprocessed_file = args.output[0]

    word_separation(txt_file, txt_preprocessed_file)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        usage = '%(prog)s [options]',
        description =
'''
example:
  $ python3 ./WordSeparation.py -c config.json -i domain_text.txt domain_text_wakati_preprocessed.txt
''',
        add_help = True,
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument('-c', '--config', required=True, help="Configuration file path. (ex. config.json)")
    parser.add_argument('-i', '--input', required=True, help="Input file(s)", nargs='*')
    parser.add_argument('-o', '--output', required=True, help="Output file(s)", nargs='*')
    args = parser.parse_args()
    print ("start: " + os.path.basename(__file__))
    print("args: " + str(args))

    with open(args.config) as f:
        config = json.load(f)
    print("config:" + str(config))

    if check_arg(args, config):
        main(args, config)
    else:
        exit(1)

    print ("finish: " + os.path.basename(__file__))
    exit(0)
