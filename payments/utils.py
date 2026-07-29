def amount_in_words(amount):
    if amount is None:
        return "Zero"
    amount = int(round(amount))
    if amount == 0:
        return "Zero"
    crore = amount // 10000000
    remainder = amount % 10000000
    lakh = remainder // 100000
    remainder = remainder % 100000
    thousand = remainder // 1000
    remainder = remainder % 1000
    hundred = remainder // 100
    tens = remainder % 100
    parts = []
    if crore > 0:
        parts.append(f"{_num_to_words(crore)} Crore")
    if lakh > 0:
        parts.append(f"{_num_to_words(lakh)} Lakh")
    if thousand > 0:
        parts.append(f"{_num_to_words(thousand)} Thousand")
    if hundred > 0:
        parts.append(f"{_num_to_words(hundred)} Hundred")
    if tens > 0:
        if parts:
            parts.append(f"and {_num_to_words(tens)}")
        else:
            parts.append(_num_to_words(tens))
    return "Rupees " + " ".join(parts) + " Only"


def _num_to_words(n):
    if n == 0:
        return ""
    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    if n < 20:
        return ones[n]
    if n < 100:
        t = tens[n // 10]
        o = ones[n % 10]
        return f"{t} {o}" if o else t
    return str(n)
