from sqlalchemy import text
from extensions import db

def get_nearby_duplicates(lat, lon, category, radius=100):
    # Use text() to define the SQL call
    sql = text("""
        SELECT * FROM check_nearby_duplicate(
            :lat, :lon, :category, :radius
        )
    """)
    
    # Execute and fetch results
    result = db.session.execute(sql, {
        'lat': lat,
        'lon': lon,
        'category': category,
        'radius': radius
    })
    
    # Transform rows into a list of dictionaries
    duplicates = []
    for row in result:
        duplicates.append({
            "ReportID": str(row.ReportID),
            "Category": row.Category,
            "Location": row.Location,
            "Status": row.Status,
            "DistanceMeters": round(row.DistanceMeters, 2)
        })
    
    return duplicates