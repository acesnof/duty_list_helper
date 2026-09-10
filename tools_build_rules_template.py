import importlib.util
import io
import sys
import zipfile
from datetime import date
from pathlib import Path


source = Path(r"C:\Users\fonse\Desktop\Duty List Helper\duty_rules_docx.py")
spec = importlib.util.spec_from_file_location("reference_rules", source)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
data = module.build_duty_rules_docx(
    Path(r"C:\Users\fonse\Desktop\Duty List Helper\static\assets\logo_eutm.png"),
    {
        "duty_list_mode": "all_days",
        "leave_days_before": 9001,
        "leave_days_after": 9002,
        "mission_start_days": 9003,
        "mission_end_days": 9004,
    },
    date(2099, 12, 31),
)
source_zip = zipfile.ZipFile(io.BytesIO(data), "r")
output = io.BytesIO()
with zipfile.ZipFile(output, "w") as target:
    for item in source_zip.infolist():
        payload = source_zip.read(item.filename)
        if item.filename.endswith(".xml"):
            text = payload.decode("utf-8")
            replacements = {
                "Duty List - All days": "{{MODE}}",
                "One continuous rotation covers every calendar day.": "{{MODE_DETAIL}}",
                "9001 days": "{{BEFORE}} days",
                "9002 days": "{{AFTER}} days",
                "9003 days": "{{SOM}} days",
                "9004 days": "{{EOM}} days",
                "31 December 2099": "{{CREATED}}",
            }
            for old, new in replacements.items():
                text = text.replace(old, new)
            payload = text.encode("utf-8")
        target.writestr(item, payload)
Path(sys.argv[1]).write_bytes(output.getvalue())
