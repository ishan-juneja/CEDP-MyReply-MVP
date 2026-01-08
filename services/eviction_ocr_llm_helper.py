#!/usr/bin/env python3
"""
eviction_ocr_llm_helper.py

Tests:
  1) OCR extraction from an image
  2) Eviction + 3-day gap detection from OCR text
  3) (Optional) Gemini call with a prompt / or using OCR text

Run:
  python eviction_ocr_llm_helper.py --image /path/to/file.jpg
  python eviction_ocr_llm_helper.py --image /path/to/file.jpg --ask-llm
  python eviction_ocr_llm_helper.py --self-test
"""

from __future__ import annotations

import os
import re
import json
import argparse
from datetime import datetime
from typing import Any, Dict, List, Tuple
from google import genai

from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# ----------------------------
# OCR
# ----------------------------

def ocr_extract_text(image_path: str) -> str:
    """
    Extract all text from an image.

    Tries:
      1) pytesseract + PIL
      2) easyocr

    Returns:
      Extracted text (may be empty string).
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    # Try pytesseract
    try:
        from PIL import Image  # type: ignore
        import pytesseract  # type: ignore

        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        return text.strip() if text else ""
    except ImportError:
        pass
    except Exception as e:
        print(f"Warning: pytesseract OCR failed: {e}")

    # Try easyocr
    try:
        import easyocr  # type: ignore

        reader = easyocr.Reader(["en"], gpu=False)
        results = reader.readtext(image_path, detail=0)
        return "\n".join(results).strip() if results else ""
    except ImportError:
        raise RuntimeError(
            "No OCR backend available.\n"
            "Install one of:\n"
            "  - pip install pillow pytesseract  (and install tesseract system binary)\n"
            "  - pip install easyocr\n"
        )
    except Exception as e:
        raise RuntimeError(f"OCR failed with easyocr: {e}")


# ----------------------------
# Free LLM API call (Gemini)
# ----------------------------
# Create ONE client (module-level is fine)
_GEMINI_CLIENT = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options={"api_version": "v1alpha"},
)

def llm_query_gemini(prompt: str, model: str = "gemini-2.5-flash") -> str:
    """
    Gemini call using official google-genai SDK (FREE tier compatible).

    Requires:
      export GEMINI_API_KEY="..."

    Returns:
      Model-generated text.
    """
    if not os.getenv("GEMINI_API_KEY"):
        raise EnvironmentError("Missing GEMINI_API_KEY environment variable.")

    response = _GEMINI_CLIENT.models.generate_content(
        model=model,
        contents=prompt,
    )

    # SDK guarantees text normalization
    if not response or not response.text:
        raise RuntimeError(f"Empty Gemini response: {response}")

    return response.text

# ----------------------------
# Eviction + 3-day gap detector
# ----------------------------

EVICTION_KEYWORDS = [
    "eviction",
    "unlawful detainer",
    "notice to quit",
    "notice to vacate",
    "pay or quit",
    "cure or quit",
    "three-day notice",
    "3-day notice",
    "3 day notice",
]

DATE_REGEXES = [
    r"\b(?P<m>\d{1,2})/(?P<d>\d{1,2})/(?P<y>\d{2,4})\b",
    r"\b(?P<m>\d{1,2})-(?P<d>\d{1,2})-(?P<y>\d{2,4})\b",
    r"\b(?P<month>Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
    r"Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
    r"\s+(?P<d>\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(?P<y>\d{4})\b",
]

MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}


def _normalize_year(y: int) -> int:
    return 2000 + y if y < 100 else y


def extract_dates(text: str) -> List[datetime]:
    dates: List[datetime] = []
    s = text or ""

    for rx in DATE_REGEXES:
        for m in re.finditer(rx, s, flags=re.IGNORECASE):
            gd = m.groupdict()
            try:
                if gd.get("month"):
                    month = MONTH_MAP.get(gd["month"].lower())
                    if not month:
                        continue
                    day = int(gd["d"])
                    year = int(gd["y"])
                    dt = datetime(_normalize_year(year), month, day)
                else:
                    month = int(gd["m"])
                    day = int(gd["d"])
                    year = int(gd["y"])
                    dt = datetime(_normalize_year(year), month, day)
                dates.append(dt)
            except Exception:
                continue

    uniq = sorted({d.date(): d for d in dates}.values(), key=lambda x: x)
    return uniq


def detect_eviction_and_3_day_gap(ocr_text: str) -> Dict[str, Any]:
    t = (ocr_text or "").lower()

    keyword_hits = [kw for kw in EVICTION_KEYWORDS if kw in t]
    looks_like_eviction = len(keyword_hits) > 0

    explicit_three_day = any(
        phrase in t for phrase in [
            "three-day notice",
            "three day notice",
            "3-day notice",
            "3 day notice",
            "three (3) day",
            "(3) day notice",
            "within 3 days",
            "within three days",
        ]
    )

    dates = extract_dates(ocr_text)
    date_pairs_3_days: List[Tuple[str, str, int]] = []
    for i in range(len(dates)):
        for j in range(i + 1, len(dates)):
            diff = abs((dates[j].date() - dates[i].date()).days)
            if diff == 3:
                date_pairs_3_days.append(
                    (dates[i].date().isoformat(), dates[j].date().isoformat(), diff)
                )

    has_three_day_gap = explicit_three_day or bool(date_pairs_3_days)

    return {
        "looks_like_eviction": looks_like_eviction,
        "keyword_hits": keyword_hits,
        "explicit_three_day_language": explicit_three_day,
        "extracted_dates": [d.date().isoformat() for d in dates],
        "date_pairs_with_3_day_gap": date_pairs_3_days,
        # This is really "likely 3-day eviction NOTICE", not "evicted".
        "evicted_with_3_day_gap": bool(looks_like_eviction and has_three_day_gap),
    }

def generate_eviction_argument_section_from_up_codes(
    up_codes: list[str],
    tenant_context: dict,
) -> str:
    """
    Uses selected UP codes to generate a single, smooth legal argument
    narrative for an eviction court filing.

    Args:
        up_codes (list[str]): Legal argument identifiers (e.g., ["UP003", "UP013"])
        tenant_context (dict): Metadata like state, eviction type, etc.

    Returns:
        str: A composed legal argument section suitable for a PDF.
    """

    LEGAL_ARGUMENTS = {
        "UP003": {
            "short_claim": (
                "I did not receive ten full days to either pay the rent owed or move out."
            ),
            "long_explanation": (
                "Under C.R.S. 13-40-104(1)(d), a landlord must provide at least ten full days "
                "of notice before filing an eviction lawsuit. My eviction notice expired "
                "before ten full days had passed."
            ),
        },
        "UP001": {
            "short_claim": (
                "I do not owe the rent claimed because I paid the full amount due."
            ),
            "long_explanation": (
                "A landlord cannot prevail in an eviction case based on nonpayment of rent "
                "if the tenant has paid all rent owed, and I am prepared to provide proof of payment."
            ),
        },
        "UP013": {
            "short_claim": (
                "I attempted to pay the full amount of rent owed, but my landlord refused to accept it."
            ),
            "long_explanation": (
                "If a tenant offers full payment of rent, the landlord must accept it and "
                "stop the eviction process, even if a lawsuit has already been filed."
            ),
        },
    }

    # ----------------------------
    # Step 1: Validate & limit arguments
    # ----------------------------
    valid_args = [
        LEGAL_ARGUMENTS[code]
        for code in up_codes
        if code in LEGAL_ARGUMENTS
    ][:2]  # enforce max 2

    if not valid_args:
        return ""

    # ----------------------------
    # Step 2: Build LLM prompt
    # ----------------------------
    argument_text = "\n".join(
        f"- {arg['short_claim']} {arg['long_explanation']}"
        for arg in valid_args
    )

    prompt = f"""
You are helping a tenant draft a clear, professional legal statement
to include in an eviction court filing.

STRICT CONSTRAINTS:
- Do NOT invent new legal arguments
- Do NOT add facts not explicitly stated
- Do NOT cite additional statutes or case law
- Use respectful, first-person language
- Merge the arguments into one cohesive narrative (no bullets)

Tenant context:
- State: {tenant_context.get("state")}
- Eviction type: {tenant_context.get("eviction_type")}

Legal arguments to include:
{argument_text}

Write a single well-flowing paragraph explaining why the eviction should not proceed.
"""

    # ----------------------------
    # Step 3: Generate text via LLM
    # ----------------------------
    return llm_query_gemini(prompt)

# ----------------------------
# Main tests
# ----------------------------

def run_self_test() -> None:
    """No-image self-test: validates detection logic and date parsing."""
    sample = """
    THREE-DAY NOTICE TO PAY RENT OR QUIT
    Notice served on: 01/01/2026
    You must pay within three days. Deadline: 01/04/2026
    """
    print("=== SELF TEST INPUT TEXT ===")
    print(sample.strip(), "\n")

    result = detect_eviction_and_3_day_gap(sample)
    print("=== SELF TEST RESULT ===")
    print(json.dumps(result, indent=2), "\n")

    assert result["looks_like_eviction"] is True
    assert result["evicted_with_3_day_gap"] is True
    print("Self-test passed ✅\n")

def test_generate_eviction_argument_section_from_up_codes():
    """
    Real integration test using Gemini.
    """

    up_codes = ["UP003", "UP013"]

    tenant_context = {
        "state": "Colorado",
        "eviction_type": "Nonpayment of Rent",
    }

    print("\n=== RUNNING REAL LLM ARGUMENT TEST ===\n")

    result = generate_eviction_argument_section_from_up_codes(
        up_codes=up_codes,
        tenant_context=tenant_context,
    )

    print(result)
    print("\n=== END GENERATED ARGUMENT ===\n")

    assert isinstance(result, str)
    assert len(result.strip()) > 50


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", help="Path to image to OCR (jpg/png/etc).")
    parser.add_argument("--ask-llm", action="store_true", help="Also call Gemini (requires GEMINI_API_KEY).")
    parser.add_argument("--self-test", action="store_true", help="Run self-test without an image.")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()

    if args.image:
        print(f"=== OCR: {args.image} ===")
        text = ocr_extract_text(args.image)
        print("=== OCR TEXT (first 1500 chars) ===")
        print((text[:1500] + ("..." if len(text) > 1500 else "")) or "[no text extracted]")
        print()

        result = detect_eviction_and_3_day_gap(text)
        print("=== DETECTION RESULT (JSON) ===")
        print(json.dumps(result, indent=2))
        print()

        if args.ask_llm:
            prompt = (
                "You are helping classify whether a document is an eviction notice and whether it indicates a 3-day notice period.\n\n"
                f"OCR_TEXT:\n{text}\n\n"
                f"PROGRAMMATIC_RESULT_JSON:\n{json.dumps(result)}\n\n"
                "In 3-6 bullets, explain what signals support the classification. "
                "If uncertain, say what is missing."
            )
            print("=== GEMINI RESPONSE ===")
            print(llm_query_gemini(prompt))

    if not args.self_test and not args.image:
        parser.error("Provide --self-test and/or --image")


if __name__ == "__main__":
    test_generate_eviction_argument_section_from_up_codes()
    main()