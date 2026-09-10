import json
import sqlite3
import sys


source, destination = sys.argv[1:3]
db = sqlite3.connect(source)
db.row_factory = sqlite3.Row


def rows(sql, args=()):
    return [dict(row) for row in db.execute(sql, args)]


people = rows("""SELECT p.*, n.name nationality, n.code nationality_code, r.name rank
    FROM personnel p JOIN nationalities n ON n.id=p.nationality_id JOIN ranks r ON r.id=p.rank_id
    ORDER BY CASE WHEN r.name LIKE 'OF-%' THEN 1 WHEN r.name LIKE 'WO-%' THEN 2
                  WHEN r.name LIKE 'OR-%' THEN 3 ELSE 4 END,
             CAST(substr(r.name,instr(r.name,'-')+1) AS INTEGER) DESC,
             p.last_name,p.first_name""")
exemptions = rows("""SELECT e.*, p.first_name||' '||p.last_name person_name
    FROM exemptions e JOIN personnel p ON p.id=e.person_id ORDER BY e.start_date DESC""")
changes = rows("""SELECT c.*,
    po.first_name original_first_name,po.last_name original_last_name,ro.name original_rank,
    pr.first_name replacement_first_name,pr.last_name replacement_last_name,rr.name replacement_rank
    FROM duty_changes c
    JOIN personnel po ON po.id=c.original_person_id JOIN ranks ro ON ro.id=po.rank_id
    JOIN personnel pr ON pr.id=c.replacement_person_id JOIN ranks rr ON rr.id=pr.rank_id
    ORDER BY c.duty_date""")
seed = {
    "nationalities": rows("SELECT * FROM nationalities ORDER BY name"),
    "ranks": rows("""SELECT * FROM ranks ORDER BY
        CASE WHEN name LIKE 'OF-%' THEN 1 WHEN name LIKE 'WO-%' THEN 2
             WHEN name LIKE 'OR-%' THEN 3 ELSE 4 END,
        CAST(substr(name,instr(name,'-')+1) AS INTEGER) DESC, name"""),
    "people": people,
    "exemptions": exemptions,
    "days_off": rows("SELECT * FROM days_off ORDER BY day_date DESC, id DESC"),
    "duty_assignments": rows("SELECT * FROM duty_assignments ORDER BY day_date"),
    "duty_changes": changes,
    "validated_days": [row["day_date"] for row in rows("SELECT day_date FROM validated_days ORDER BY day_date")],
    "settings": {row["setting_key"]: row["setting_value"] for row in rows("SELECT * FROM app_settings")},
}
with open(destination, "w", encoding="utf-8") as stream:
    json.dump(seed, stream, ensure_ascii=False, separators=(",", ":"))
