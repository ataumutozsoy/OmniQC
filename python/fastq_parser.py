from Bio import SeqIO
import gzip
import os
import sys
import json
import math

def parse_fastq(file_path):
    """
    Generator that yields records from a FASTQ file.
    Handles both .fastq and .fastq.gz
    """
    if file_path.endswith('.gz'):
        handle = gzip.open(file_path, "rt")
    else:
        handle = open(file_path, "r")
    
    try:
        for record in SeqIO.parse(handle, "fastq"):
            yield record
    finally:
        handle.close()

def analyze_fastq(file_path):
    stats = {
        "total_reads": 0,
        "total_bases": 0,
        "gc_count": 0,
        "q_score_sum": 0,
        "min_len": float('inf'),
        "max_len": 0,
        "length_distribution": {},
        "quality_distribution": {},
        "quality_counts": {},
        # New metrics
        "per_sequence_quality": {},
        "per_sequence_gc": {},
        "per_base_content": {},
        "sequence_duplication": {},
        "adapter_content": {},
        "read_lengths": []  # For N50 calculation
    }
    
    # Adapter sequences (simplified)
    adapters = {
        "Illumina Universal": "AGATCGGAAGAG",
        "Nextera": "CTGTCTCTTATA",
        "Small RNA": "TGGAATTCTCGG"
    }

    try:
        # Open file handle here so we can access it for progress
        if file_path.endswith('.gz'):
            handle = gzip.open(file_path, "rt")
        else:
            handle = open(file_path, "r")

        try:
            for record in SeqIO.parse(handle, "fastq"):
                stats["total_reads"] += 1
                seq_len = len(record.seq)
                stats["total_bases"] += seq_len
                
                # Length stats
                if seq_len < stats["min_len"]: stats["min_len"] = seq_len
                if seq_len > stats["max_len"]: stats["max_len"] = seq_len
                
                len_bin = (seq_len // 10) * 10
                stats["length_distribution"][len_bin] = stats["length_distribution"].get(len_bin, 0) + 1
                
                # Collect read lengths for N50 (limit to first 100k reads for memory)
                if len(stats["read_lengths"]) < 100000:
                    stats["read_lengths"].append(seq_len)
    
                # GC Content
                gc_count = record.seq.count("G") + record.seq.count("C")
                stats["gc_count"] += gc_count
    
                # Quality Scores
                qualities = record.letter_annotations["phred_quality"]
                stats["q_score_sum"] += sum(qualities)
    
                # Per position quality (limit to first 200bp for performance/size)
                for i, q in enumerate(qualities[:200]):
                    stats["quality_distribution"][i] = stats["quality_distribution"].get(i, 0) + q
                    stats["quality_counts"][i] = stats["quality_counts"].get(i, 0) + 1
                
                # --- New Metrics Calculation ---
                
                # Per Sequence Quality
                if len(qualities) > 0:
                    mean_q = int(sum(qualities) / len(qualities))
                    stats["per_sequence_quality"][mean_q] = stats["per_sequence_quality"].get(mean_q, 0) + 1

                # Per Sequence GC
                if seq_len > 0:
                    gc_pct = int((gc_count / seq_len) * 100)
                    stats["per_sequence_gc"][gc_pct] = stats["per_sequence_gc"].get(gc_pct, 0) + 1

                # Per Base Content (limit to first 200bp)
                seq_str = str(record.seq).upper()
                for i, char in enumerate(seq_str[:200]):
                    if i not in stats["per_base_content"]:
                        stats["per_base_content"][i] = {'A':0, 'T':0, 'G':0, 'C':0, 'N':0}
                    if char in stats["per_base_content"][i]:
                        stats["per_base_content"][i][char] += 1
                
                # Duplication (limit memory usage: track first 100k unique sequences)
                # If we have too many unique sequences, stop tracking to avoid OOM
                if len(stats["sequence_duplication"]) < 100000:
                    stats["sequence_duplication"][seq_str] = stats["sequence_duplication"].get(seq_str, 0) + 1
                elif seq_str in stats["sequence_duplication"]:
                    # Still count if we already tracking it
                    stats["sequence_duplication"][seq_str] += 1
                
                # Adapter Content (check first 100k reads only for speed)
                if stats["total_reads"] <= 100000:
                    for name, seq in adapters.items():
                        if seq in seq_str:
                            stats["adapter_content"][name] = stats["adapter_content"].get(name, 0) + 1
                
                # Progress update
                if stats["total_reads"] % 1000 == 0:
                    try:
                        current_pos = 0
                        # Try to get the underlying file object's position
                        if hasattr(handle, 'buffer') and hasattr(handle.buffer, 'fileobj'):
                            current_pos = handle.buffer.fileobj.tell()
                        elif hasattr(handle, 'fileobj'):
                            current_pos = handle.fileobj.tell()
                        elif hasattr(handle, 'tell'):
                            current_pos = handle.tell()
                        
                        file_size = os.path.getsize(file_path)
                        
                        # Debug logging to stderr (visible in terminal)
                        # sys.stderr.write(f"DEBUG: Read {stats['total_reads']}, Pos {current_pos}/{file_size}\n")
                        # sys.stderr.flush()
    
                        if file_size > 0:
                            percent = min(99, int((current_pos / file_size) * 100))
                            
                            # Send to Electron
                            sys.stdout.write(f"PROGRESS:{percent}\n")
                            sys.stdout.flush()
                            
                            # Also log to stderr for user verification
                            sys.stderr.write(f"Processing: {percent}% ({stats['total_reads']} reads)\n")
                            sys.stderr.flush()
                            
                    except Exception as e:
                        sys.stderr.write(f"Progress Error: {str(e)}\n")
                        sys.stderr.flush()
        finally:
            handle.close()

    except Exception as e:
        return {"error": str(e)}

    # Finalize stats
    if stats["total_reads"] > 0:
        avg_read_length = stats["total_bases"] / stats["total_reads"]
        gc_content = (stats["gc_count"] / stats["total_bases"]) * 100
        avg_q_score = stats["q_score_sum"] / stats["total_bases"]
    else:
        avg_read_length = 0
        gc_content = 0
        avg_q_score = 0
        stats["min_len"] = 0

    # Calculate N50
    n50 = 0
    if stats["read_lengths"]:
        sorted_lengths = sorted(stats["read_lengths"], reverse=True)
        total_length = sum(sorted_lengths)
        running_sum = 0
        for length in sorted_lengths:
            running_sum += length
            if running_sum >= total_length / 2:
                n50 = length
                break

    # Format distributions for frontend
    length_dist = [
        {"range": f"{k}-{k+9}", "count": v} 
        for k, v in sorted(stats["length_distribution"].items())
    ]

    quality_dist = [
        {"pos": k + 1, "quality": v / stats["quality_counts"][k]}
        for k, v in sorted(stats["quality_distribution"].items())
    ]

    # Per Sequence Quality Distribution
    per_seq_quality_dist = [
        {"quality": k, "count": v}
        for k, v in sorted(stats.get("per_sequence_quality", {}).items())
    ]

    # Per Sequence GC Distribution
    per_seq_gc_dist = [
        {"gc": k, "count": v}
        for k, v in sorted(stats.get("per_sequence_gc", {}).items())
    ]

    # Calculate Theoretical GC Distribution (Normal Distribution)
    theoretical_gc_dist = []
    if stats["total_reads"] > 0 and stats.get("per_sequence_gc"):
        # Calculate Mean and StdDev from the histogram
        total_counts = sum(stats["per_sequence_gc"].values())
        weighted_sum = sum(k * v for k, v in stats["per_sequence_gc"].items())
        mean_gc = weighted_sum / total_counts
        
        variance_sum = sum(v * ((k - mean_gc) ** 2) for k, v in stats["per_sequence_gc"].items())
        std_dev_gc = math.sqrt(variance_sum / total_counts)
        
        # Generate Normal Distribution points
        # Formula: f(x) = (1 / (sigma * sqrt(2*pi))) * exp(-0.5 * ((x-mu)/sigma)^2)
        # We scale this by total_reads to match the observed counts
        if std_dev_gc > 0:
            for x in range(101): # 0 to 100%
                exponent = -0.5 * (((x - mean_gc) / std_dev_gc) ** 2)
                pdf = (1 / (std_dev_gc * math.sqrt(2 * math.pi))) * math.exp(exponent)
                theoretical_count = pdf * total_counts
                theoretical_gc_dist.append({"gc": x, "count": theoretical_count})
        else:
            # If std_dev is 0 (all reads have exact same GC), theoretical is a spike
            theoretical_gc_dist = [{"gc": int(mean_gc), "count": total_counts}]

    # Per Base Sequence Content
    per_base_content = []
    max_pos = max(stats.get("per_base_content", {}).keys()) if stats.get("per_base_content") else -1
    
    # Define bins: 1-9 (1bp), then 5bp windows
    current_pos = 0
    while current_pos <= max_pos:
        if current_pos < 9:
            # Single base resolution for first 9 bases (0-8 index)
            end_pos = current_pos + 1
            label = str(current_pos + 1)
        else:
            # 5bp bins
            end_pos = min(current_pos + 5, max_pos + 1)
            label = f"{current_pos + 1}-{end_pos}"
            
        # Aggregate counts for this bin
        bin_counts = {'A':0, 'T':0, 'G':0, 'C':0, 'N':0}
        bin_total = 0
        
        for i in range(current_pos, end_pos):
            counts = stats.get("per_base_content", {}).get(i, {'A':0, 'T':0, 'G':0, 'C':0, 'N':0})
            for base, count in counts.items():
                bin_counts[base] += count
                bin_total += count
        
        if bin_total > 0:
            per_base_content.append({
                "pos": label,
                "A": (bin_counts['A'] / bin_total) * 100,
                "T": (bin_counts['T'] / bin_total) * 100,
                "G": (bin_counts['G'] / bin_total) * 100,
                "C": (bin_counts['C'] / bin_total) * 100,
                "N": (bin_counts['N'] / bin_total) * 100
            })
            
        current_pos = end_pos

    # Sequence Duplication Levels
    # Group by duplication count (1, 2, 3, 4, 5, 6-10, 11-50, 51-100, 100+)
    duplication_levels = {
        "1": 0, "2": 0, "3": 0, "4": 0, "5": 0,
        "6-10": 0, "11-50": 0, "51-100": 0, "100+": 0
    }
    
    # Calculate duplication stats from the counter
    # We only tracked first 100k unique sequences to save memory, so this is an estimate
    total_deduplicated = 0
    total_sequences_checked = 0
    
    if "sequence_duplication" in stats:
        for count in stats["sequence_duplication"].values():
            total_sequences_checked += count
            total_deduplicated += 1
            
            if count == 1: duplication_levels["1"] += 1
            elif count == 2: duplication_levels["2"] += 1
            elif count == 3: duplication_levels["3"] += 1
            elif count == 4: duplication_levels["4"] += 1
            elif count == 5: duplication_levels["5"] += 1
            elif count <= 10: duplication_levels["6-10"] += 1
            elif count <= 50: duplication_levels["11-50"] += 1
            elif count <= 100: duplication_levels["51-100"] += 1
            else: duplication_levels["100+"] += 1

    duplication_dist = [
        {"level": k, "percentage": (v / total_deduplicated * 100) if total_deduplicated > 0 else 0}
        for k, v in duplication_levels.items()
    ]
    
    # Overrepresented Sequences (Top 5)
    overrepresented_seqs = []
    if "sequence_duplication" in stats:
        # Sort by count descending
        sorted_seqs = sorted(stats["sequence_duplication"].items(), key=lambda x: x[1], reverse=True)
        for seq, count in sorted_seqs[:5]:
            if count > 1: # Only include if actually duplicated
                percentage = (count / stats["total_reads"]) * 100
                # Only show if > 0.1% of total reads (FastQC threshold)
                if percentage > 0.1:
                    overrepresented_seqs.append({
                        "sequence": seq,
                        "count": count,
                        "percentage": percentage,
                        "possible_source": "Unknown" # We don't have a database of contaminants yet
                    })

    # Adapter Content
    adapter_content = []
    if "adapter_content" in stats:
        for name, count in stats["adapter_content"].items():
            adapter_content.append({
                "name": name,
                "percentage": (count / stats["total_reads"]) * 100
            })

    # Platform Detection Logic
    platform = "Unknown"
    if stats["total_reads"] > 0:
        # Check first read header for patterns
        try:
            # Re-open file briefly to check header
            if file_path.endswith('.gz'):
                with gzip.open(file_path, "rt") as f:
                    first_line = f.readline().strip()
            else:
                with open(file_path, "r") as f:
                    first_line = f.readline().strip()
            
            if "runid=" in first_line or "ch=" in first_line:
                platform = "Nanopore"
            elif first_line.endswith("/ccs") or first_line.startswith("@m"):
                platform = "PacBio"
            elif first_line.startswith("@V") or first_line.startswith("@E") or first_line.startswith("@CL"):
                # Heuristic for MGI/DNBSEQ (often start with V, E, or CL)
                if avg_read_length < 1000:
                    platform = "MGI"
                else:
                    platform = "Long Read (Unknown)"
            elif first_line.count(":") >= 4:
                # Standard Illumina header has many colons
                platform = "Illumina"
            else:
                # Fallback based on length
                if avg_read_length > 1000:
                    platform = "Long Read"
                else:
                    platform = "Short Read"
                    
        except Exception:
            platform = "Unknown"

    # ============================================
    # QUALITY ASSESSMENT (FastQC-style Pass/Warn/Fail)
    # ============================================
    
    def assess_quality(metrics):
        """
        Assess quality metrics and return Pass/Warn/Fail status for each.
        Thresholds based on FastQC standards.
        """
        status = {}
        
        # 1. Per-base sequence quality
        # Pass: All positions have median Q >= 25
        # Warn: Any position has median Q < 25
        # Fail: Any position has median Q < 20
        if quality_dist:
            min_quality = min(d["quality"] for d in quality_dist if d["quality"] > 0)
            if min_quality >= 25:
                status["per_base_quality"] = {"status": "pass", "message": "All positions have good quality"}
            elif min_quality >= 20:
                status["per_base_quality"] = {"status": "warn", "message": f"Some positions have quality below 25 (min: {min_quality:.1f})"}
            else:
                status["per_base_quality"] = {"status": "fail", "message": f"Some positions have poor quality (min: {min_quality:.1f})"}
        else:
            status["per_base_quality"] = {"status": "warn", "message": "No quality data available"}
        
        # 2. Per-sequence quality scores
        # Pass: Most common quality >= 27
        # Warn: Most common quality < 27
        # Fail: Most common quality < 20
        if per_seq_quality_dist:
            # Find mode (most common mean quality)
            mode_quality = max(per_seq_quality_dist, key=lambda x: x["count"])["quality"]
            if mode_quality >= 27:
                status["per_sequence_quality"] = {"status": "pass", "message": f"Most sequences have good quality (mode: {mode_quality})"}
            elif mode_quality >= 20:
                status["per_sequence_quality"] = {"status": "warn", "message": f"Average quality is moderate (mode: {mode_quality})"}
            else:
                status["per_sequence_quality"] = {"status": "fail", "message": f"Most sequences have poor quality (mode: {mode_quality})"}
        else:
            status["per_sequence_quality"] = {"status": "warn", "message": "No per-sequence quality data"}
        
        # 3. Per-base sequence content (A/T/G/C balance)
        # Pass: Difference between A-T or G-C < 10% at all positions
        # Warn: Difference > 10% at any position
        # Fail: Difference > 20% at any position
        if per_base_content:
            max_diff = 0
            for pos in per_base_content:
                at_diff = abs(pos.get("A", 0) - pos.get("T", 0))
                gc_diff = abs(pos.get("G", 0) - pos.get("C", 0))
                max_diff = max(max_diff, at_diff, gc_diff)
            
            if max_diff <= 10:
                status["per_base_content"] = {"status": "pass", "message": "Base content is balanced"}
            elif max_diff <= 20:
                status["per_base_content"] = {"status": "warn", "message": f"Some positions show base imbalance ({max_diff:.1f}% difference)"}
            else:
                status["per_base_content"] = {"status": "fail", "message": f"Significant base imbalance detected ({max_diff:.1f}% difference)"}
        else:
            status["per_base_content"] = {"status": "warn", "message": "No base content data"}
        
        # 4. GC content
        # Pass: Central peak matches theoretical distribution
        # Warn: Unusual distribution shape
        # Fail: Bimodal or very unusual distribution
        if gc_content is not None:
            if 35 <= gc_content <= 65:
                status["gc_content"] = {"status": "pass", "message": f"GC content is normal ({gc_content:.1f}%)"}
            elif 20 <= gc_content <= 80:
                status["gc_content"] = {"status": "warn", "message": f"GC content is unusual ({gc_content:.1f}%)"}
            else:
                status["gc_content"] = {"status": "fail", "message": f"GC content is extreme ({gc_content:.1f}%)"}
        else:
            status["gc_content"] = {"status": "warn", "message": "No GC data"}
        
        # 5. N content
        # Check per_base_content for N percentage
        if per_base_content:
            max_n = max((pos.get("N", 0) for pos in per_base_content), default=0)
            if max_n < 5:
                status["n_content"] = {"status": "pass", "message": f"Low N content (max: {max_n:.1f}%)"}
            elif max_n < 20:
                status["n_content"] = {"status": "warn", "message": f"Moderate N content (max: {max_n:.1f}%)"}
            else:
                status["n_content"] = {"status": "fail", "message": f"High N content (max: {max_n:.1f}%)"}
        else:
            status["n_content"] = {"status": "pass", "message": "No N content issues detected"}
        
        # 6. Sequence duplication
        # Pass: < 20% sequences are duplicates
        # Warn: 20-50% duplicates
        # Fail: > 50% duplicates
        total_dup = sum(d["percentage"] for d in duplication_dist if d["level"] != "1") if duplication_dist else 0
        if total_dup < 20:
            status["sequence_duplication"] = {"status": "pass", "message": f"Low duplication ({total_dup:.1f}%)"}
        elif total_dup < 50:
            status["sequence_duplication"] = {"status": "warn", "message": f"Moderate duplication ({total_dup:.1f}%)"}
        else:
            status["sequence_duplication"] = {"status": "fail", "message": f"High duplication ({total_dup:.1f}%)"}
        
        # 7. Adapter content
        # Pass: < 5% adapter at all positions
        # Warn: 5-10% adapter
        # Fail: > 10% adapter
        if adapter_content:
            max_adapter = max(
                max(pos.get(adapter, 0) for adapter in ["Illumina Universal", "Nextera", "Small RNA"])
                for pos in adapter_content
            ) if adapter_content else 0
            
            if max_adapter < 5:
                status["adapter_content"] = {"status": "pass", "message": "Low adapter content"}
            elif max_adapter < 10:
                status["adapter_content"] = {"status": "warn", "message": f"Some adapter contamination ({max_adapter:.1f}%)"}
            else:
                status["adapter_content"] = {"status": "fail", "message": f"High adapter contamination ({max_adapter:.1f}%)"}
        else:
            status["adapter_content"] = {"status": "pass", "message": "No adapters detected"}
        
        # Calculate overall status
        statuses = [s["status"] for s in status.values()]
        if "fail" in statuses:
            overall = "fail"
        elif "warn" in statuses:
            overall = "warn"
        else:
            overall = "pass"
        
        return {
            "overall": overall,
            "metrics": status,
            "pass_count": statuses.count("pass"),
            "warn_count": statuses.count("warn"),
            "fail_count": statuses.count("fail")
        }
    
    # Run quality assessment
    quality_status = assess_quality({
        "quality_dist": quality_dist,
        "per_seq_quality_dist": per_seq_quality_dist,
        "per_base_content": per_base_content,
        "gc_content": gc_content,
        "duplication_dist": duplication_dist,
        "adapter_content": adapter_content
    })

    return {
        "filename": os.path.basename(file_path),
        "platform": platform,
        "total_reads": stats["total_reads"],
        "total_bases": stats["total_bases"],
        "avg_read_length": avg_read_length,
        "gc_content": gc_content,
        "avg_q_score": avg_q_score,
        "min_len": stats["min_len"],
        "max_len": stats["max_len"],
        "n50": n50,
        "length_distribution": length_dist,
        "quality_distribution": quality_dist,
        "per_sequence_quality_distribution": per_seq_quality_dist,
        "per_sequence_gc_distribution": per_seq_gc_dist,
        "theoretical_gc_distribution": theoretical_gc_dist,
        "per_base_sequence_content": per_base_content,
        "duplication_levels": duplication_dist,
        "overrepresented_sequences": overrepresented_seqs,
        "adapter_content": adapter_content,
        "quality_status": quality_status
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = analyze_fastq(file_path)
    print(json.dumps(result))
