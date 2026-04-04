#!/bin/bash
# CTB Metadata
# ctb_id: CTB-73CFC8EA0865
# ctb_branch: sys
# ctb_path: sys/global-factory/compliance-check.sh
# ctb_version: 1.0.0
# created: 2025-10-23T16:37:00.726750
# checksum: fd71b743

# CTB Compliance Check Script
# Version: 1.0.0
# Verifies repository follows CTB structure

set -e

SCORE=0
MAX_SCORE=100
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="logs/compliance/${TIMESTAMP}-compliance.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create compliance logs directory
mkdir -p logs/compliance

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CTB Compliance Check v1.0.0                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}→${NC} Running compliance checks..."
echo ""

# Check CTB structure exists (35 points)
check_structure() {
  local points=0
  local required_dirs=("ctb/sys" "ctb/ai" "ctb/data" "ctb/docs" "ctb/ui" "ctb/meta" "logs")

  echo -e "${BLUE}[1/5]${NC} Checking CTB structure..."

  for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
      ((points+=5))
      echo -e "  ${GREEN}✓${NC} ${dir}"
    else
      echo -e "  ${RED}✗${NC} ${dir} (missing)"
    fi
  done

  echo -e "  Score: ${points}/35"
  echo ""
  echo $points
}

# Check global-config.yaml exists (20 points)
check_config() {
  echo -e "${BLUE}[2/5]${NC} Checking global-config.yaml..."

  if [ -f "global-config.yaml" ]; then
    echo -e "  ${GREEN}✓${NC} global-config.yaml exists"

    # Check if it's valid YAML
    if command -v python3 &> /dev/null; then
      if python3 -c "import yaml; yaml.safe_load(open('global-config.yaml'))" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} YAML is valid"
        echo -e "  Score: 20/20"
        echo ""
        echo 20
        return
      else
        echo -e "  ${YELLOW}⚠${NC} YAML syntax error"
        echo -e "  Score: 10/20"
        echo ""
        echo 10
        return
      fi
    else
      echo -e "  ${GREEN}✓${NC} File exists (YAML validation skipped)"
      echo -e "  Score: 20/20"
      echo ""
      echo 20
      return
    fi
  else
    echo -e "  ${RED}✗${NC} global-config.yaml missing"
    echo -e "  Score: 0/20"
    echo ""
    echo 0
  fi
}

# Check CTB_INDEX.md exists (20 points)
check_index() {
  echo -e "${BLUE}[3/5]${NC} Checking CTB_INDEX.md..."

  if [ -f "CTB_INDEX.md" ]; then
    local lines=$(wc -l < "CTB_INDEX.md")
    echo -e "  ${GREEN}✓${NC} CTB_INDEX.md exists (${lines} lines)"

    if [ $lines -gt 50 ]; then
      echo -e "  ${GREEN}✓${NC} Appears comprehensive"
      echo -e "  Score: 20/20"
      echo ""
      echo 20
    else
      echo -e "  ${YELLOW}⚠${NC} May need more detail"
      echo -e "  Score: 15/20"
      echo ""
      echo 15
    fi
  else
    echo -e "  ${RED}✗${NC} CTB_INDEX.md missing"
    echo -e "  Score: 0/20"
    echo ""
    echo 0
  fi
}

# Check logs directory (15 points)
check_logs() {
  echo -e "${BLUE}[4/5]${NC} Checking logs directory..."
  local points=0

  if [ -d "logs" ]; then
    ((points+=5))
    echo -e "  ${GREEN}✓${NC} logs/ exists"

    if [ -d "logs/compliance" ]; then
      ((points+=5))
      echo -e "  ${GREEN}✓${NC} logs/compliance/ exists"
    else
      echo -e "  ${YELLOW}⚠${NC} logs/compliance/ missing"
    fi

    if [ -d "logs/sync" ]; then
      ((points+=5))
      echo -e "  ${GREEN}✓${NC} logs/sync/ exists"
    else
      echo -e "  ${YELLOW}⚠${NC} logs/sync/ missing"
    fi
  else
    echo -e "  ${RED}✗${NC} logs/ missing"
  fi

  echo -e "  Score: ${points}/15"
  echo ""
  echo $points
}

# Check global factory (10 points)
check_global_factory() {
  echo -e "${BLUE}[5/5]${NC} Checking global factory..."
  local points=0

  if [ -d "ctb/sys/global-factory" ]; then
    ((points+=5))
    echo -e "  ${GREEN}✓${NC} ctb/sys/global-factory/ exists"

    if [ -f "ctb/sys/global-factory/README.md" ]; then
      ((points+=3))
      echo -e "  ${GREEN}✓${NC} README.md present"
    else
      echo -e "  ${YELLOW}⚠${NC} README.md missing"
    fi

    if [ -f "ctb/sys/global-factory/compliance-check.sh" ]; then
      ((points+=2))
      echo -e "  ${GREEN}✓${NC} compliance-check.sh present"
    else
      echo -e "  ${YELLOW}⚠${NC} compliance-check.sh missing"
    fi
  else
    echo -e "  ${RED}✗${NC} ctb/sys/global-factory/ missing"
  fi

  echo -e "  Score: ${points}/10"
  echo ""
  echo $points
}

# Run checks and capture scores
SCORE=0
STRUCT_SCORE=$(check_structure | tail -1)
CONFIG_SCORE=$(check_config | tail -1)
INDEX_SCORE=$(check_index | tail -1)
LOGS_SCORE=$(check_logs | tail -1)
FACTORY_SCORE=$(check_global_factory | tail -1)

SCORE=$((STRUCT_SCORE + CONFIG_SCORE + INDEX_SCORE + LOGS_SCORE + FACTORY_SCORE))

PERCENTAGE=$((SCORE * 100 / MAX_SCORE))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $SCORE -ge 90 ]; then
  echo -e "${GREEN}✓ CTB Compliance: PASSED${NC}"
  STATUS="pass"
  STATUS_COLOR="${GREEN}"
elif [ $SCORE -ge 75 ]; then
  echo -e "${YELLOW}⚠ CTB Compliance: WARNING${NC}"
  STATUS="warning"
  STATUS_COLOR="${YELLOW}"
else
  echo -e "${RED}✗ CTB Compliance: FAILED${NC}"
  STATUS="fail"
  STATUS_COLOR="${RED}"
fi

echo -e "${STATUS_COLOR}Score: ${SCORE}/${MAX_SCORE} (${PERCENTAGE}%)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Generate detailed JSON report
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)",
  "version": "1.0.0",
  "score": $SCORE,
  "max_score": $MAX_SCORE,
  "percentage": $PERCENTAGE,
  "status": "$STATUS",
  "min_required": 90,
  "checks": {
    "structure": {
      "score": $STRUCT_SCORE,
      "max": 35,
      "status": "checked"
    },
    "config": {
      "score": $CONFIG_SCORE,
      "max": 20,
      "status": "checked"
    },
    "index": {
      "score": $INDEX_SCORE,
      "max": 20,
      "status": "checked"
    },
    "logs": {
      "score": $LOGS_SCORE,
      "max": 15,
      "status": "checked"
    },
    "global_factory": {
      "score": $FACTORY_SCORE,
      "max": 10,
      "status": "checked"
    }
  },
  "report_file": "$REPORT_FILE"
}
EOF

echo ""
echo -e "${BLUE}→${NC} Report saved to: ${REPORT_FILE}"
echo ""

# Exit with appropriate code
if [ $SCORE -ge 90 ]; then
  exit 0
else
  exit 1
fi
