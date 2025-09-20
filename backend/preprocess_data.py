import csv
import json
from backend.ai_core import process_sos_message

INPUT_CSV_FILE = "sos_messages.csv"
OUTPUT_JSON_FILE = "processed_data.json"

def preprocess_and_save():
    """
    Reads the raw CSV data, processes each message through the AI core,
    and saves the complete, structured results to a JSON file.
    This script should only be run once, or whenever the CSV data changes.
    """
    # 1. Load the raw messages from the CSV
    raw_messages = []
    try:
        with open(INPUT_CSV_FILE, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                raw_messages.append(row)
    except FileNotFoundError:
        print(f"FATAL: The input file {INPUT_CSV_FILE} was not found. Exiting.")
        return

    print(f"--- Starting Pre-processing of {len(raw_messages)} messages ---")
    
    all_processed_data = []
    # 2. Loop through each message and process it
    for item in raw_messages:
        message_id = int(item['id'])
        text = item['message']
        
        # This calls the full AI pipeline from ai_core.py
        processed_data = process_sos_message(message_id, text)
        
        # Important: Add the result to our list even if it failed,
        # so we know what's being skipped. We will filter later.
        if processed_data:
            all_processed_data.append(processed_data)

    # 3. Save the results to the output JSON file
    with open(OUTPUT_JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_processed_data, f, indent=4)
        
    print(f"\n--- Pre-processing Complete ---")
    print(f"Successfully processed and saved data to {OUTPUT_JSON_FILE}")
    print("You can now run app.py to serve this static data.")

if __name__ == '__main__':
    # Make sure your API keys are set as environment variables before running this!
    preprocess_and_save()