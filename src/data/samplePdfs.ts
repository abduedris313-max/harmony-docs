// Simple PDF base64 generator using standard minimal PDF structures
// These are standard, valid PDF binaries encoded as base64 so they can be parsed by PDF engines and Gemini

export interface SamplePdf {
  id: string;
  title: string;
  description: string;
  badge: string;
  base64: string;
  sampleMarkdown: string;
}

// Minimal 1-page valid PDF binary encoded in Base64 containing text
const researchPaperPdfBase64 = `JVBERi0xLjQKJcOkw7zDtsOfCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvQ291bnQgMSAvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9DT250ZW50cyA0IDAgUiAvUmVzb3VyY2VzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDIzND4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzAgNzIwIFRkCihRdWFudHVtIENvbXB1dGluZzogQSBicmVha3Rocm91Z2ggaW4gU3VwZXJjb25kdWN0aW5nIFF1Yml0cykgVGoKMCAtMjAgVGQKKEFic3RyYWN0OiBUaGlzIHBhcGVyIGV4cGxvcmVzIHRoZSByZWNlbnQgYWR2YW5jZW1lbnRzIGluIHF1YW50dW0gY29tcHV0aW5nLikgVGoKMCAtMzAgVGQKKE1ldHJpY3M6KSBUagowIC0yMCBUZ3AKeyBRdWJpdHMgfCBDb2hlcmVuY2UgVGltZSB8IEVycm9yIFJhdGUgfSBpbiB0YWJsZSkgVGoKMCAtMjAgVGQKKEYgPSBtYSkgVGoKMCAtMzAgVGQKKENvbmNsdXNpb246IFF1YW50dW0gc3VwcmVtYWN5IGlzIGFjaGlldmVkLikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L0ZvbnQgPDwvRjEgPDwvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2E+Pj4+CmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolJUVPRg==`;

export const SAMPLE_PDFS: SamplePdf[] = [
  {
    id: 'research-paper',
    title: 'Research Paper: Quantum Computing',
    description: 'Academic paper layout with title, abstract, structured metrics table, and formulas.',
    badge: 'Academic',
    base64: researchPaperPdfBase64,
    sampleMarkdown: `# Quantum Computing: A Breakthrough in Superconducting Qubits

**Author:** Dr. Alex Mercer, Department of Quantum Physics  
**Date:** October 2025  

---

## Abstract
This paper explores the recent advancements in **superconducting quantum processors**. By optimizing fluxonium qubit architectures, we demonstrate a $3\\times$ reduction in decoherence noise.

---

## Performance Benchmark Metrics

| Architecture | Qubit Count | Coherence Time ($\\mu s$) | Single-Qubit Gate Fidelity | Two-Qubit Gate Fidelity |
| :--- | :--- | :--- | :--- | :--- |
| **Transmon Baseline** | 127 | 110 $\\mu s$ | 99.85% | 98.90% |
| **Fluxonium v2** | 256 | 340 $\\mu s$ | 99.94% | 99.45% |
| **Topological Hybrid** | 64 | 520 $\\mu s$ | 99.98% | 99.70% |

---

## Key Mathematical Formulation
The Hamiltonian for the multi-qubit system subject to external magnetic flux is expressed as:

$$H = \\hbar \\omega_a a^\\dagger a + \\hbar \\omega_b b^\\dagger b + g (a^\\dagger b + a b^\\dagger)$$

---

## Summary & Future Directions
1. **Scalability:** Next-generation dilution refrigerators can house up to 10,000 physical qubits.
2. **Error Correction:** Surface code threshold reached with sub-0.5% logical error rate per cycle.
3. **Applications:** Molecular simulation for room-temperature superconductors.`
  },
  {
    id: 'business-report',
    title: 'Q3 Financial & Strategy Report',
    description: 'Corporate report featuring executive summaries, financial tables, and key milestones.',
    badge: 'Business',
    base64: researchPaperPdfBase64,
    sampleMarkdown: `# Executive Quarterly Financial Report - Q3

**Company:** Apex Global Technologies Inc.  
**Prepared By:** Office of the Chief Financial Officer  

---

## Executive Summary
During Q3, revenue expanded by **24.5% year-over-year**, reaching **$14.8M**. Operating margins improved due to automated cloud infrastructure efficiencies.

### Key Financial Highlights
- **Gross Margin:** 78.2% (up from 72.1% in Q2)
- **Net ARR Growth:** $3.2M added in new annual recurring subscription contracts
- **Customer Retention Rate:** 96.4% net revenue retention

---

## Regional Performance Breakdown

| Region | Active Accounts | Q2 Revenue | Q3 Revenue | YoY Growth |
| :--- | :---: | :---: | :---: | :---: |
| **North America** | 1,420 | $6.2M | $7.8M | +25.8% |
| **Europe (EMEA)** | 890 | $3.8M | $4.5M | +18.4% |
| **Asia Pacific** | 560 | $1.9M | $2.5M | +31.5% |
| **Total** | **2,870** | **$11.9M** | **$14.8M** | **+24.4%** |

---

## Key Action Items for Q4
- [x] Complete SOC-2 Type II audit certification
- [x] Launch enterprise single sign-on (SSO) module
- [ ] Expand EMEA sales division by 12 headcount
- [ ] Finalize Q4 capital expenditure budget planning`
  }
];
