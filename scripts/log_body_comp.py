#!/usr/bin/env python3
"""
Log a smart scale reading to Supabase body_composition_logs.
Usage: python3 log_body_comp.py

Edit the record dict below with today's values before running.
"""

import json, urllib.request, time

SUPABASE_URL = 'https://gjusyswosfbrgngwjvbx.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdXN5c3dvc2ZicmduZ3dqdmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDM4MTAsImV4cCI6MjA5OTYxOTgxMH0.fW0Bocfsod-qjEw5n2Kx4E_IIputn38nCWuhyWFcOfw'

def log_reading(record: dict):
    data = json.dumps(record).encode()
    req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/body_composition_logs',
        data=data,
        headers={
            'apikey': ANON_KEY,
            'Authorization': f'Bearer {ANON_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        method='POST'
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

if __name__ == '__main__':
    record = {
        'id': int(time.time() * 1000),
        'date': '2026-07-15',
        'time': '07:50:00',
        'weight_lb': 163.1,
        'bmi': 22.8,
        'body_fat_pct': 16.0,
        'fat_free_lb': 136.9,
        'subcut_fat_pct': 14.2,
        'body_water_pct': 60.5,
        'skeletal_muscle_pct': 54.2,
        'muscle_mass_lb': 130.0,
        'bone_mass_lb': 6.8,
        'bmr_kcal': 1695,
        'visceral_fat': 6,
        'protein_pct': 19.1,
        'metabolic_age': 39,
        'source': 'smart-scale'
    }
    result = log_reading(record)
    print('Logged:', json.dumps(result, indent=2))
