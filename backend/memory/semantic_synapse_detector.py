"""
Semantic Synapse Detector
Advanced collaboration detection using semantic analysis
Updated: 2025-07-06 23:30:00
"""

from typing import Dict, List, Optional, Tuple
from models.schemas import Message, SynapseType
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from loguru import logger
import re
from dataclasses import dataclass


@dataclass
class SemanticScore:
    """Represents a semantic similarity score between messages"""
    similarity: float
    synapse_type: SynapseType
    confidence: float
    evidence: List[str]


class SemanticSynapseDetector:
    """
    Advanced synapse detection using semantic embeddings and NLP
    Improves upon keyword-based detection with true semantic understanding
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize with a lightweight sentence embedding model"""
        try:
            self.model = SentenceTransformer(model_name)
            self.enabled = True
            logger.info(f"Semantic synapse detector initialized with {model_name}")
        except Exception as e:
            logger.warning(f"Failed to load semantic model: {e}. Falling back to keyword detection.")
            self.model = None
            self.enabled = False        
        # Configurable thresholds
        self.thresholds = {
            "high_similarity": 0.85,
            "medium_similarity": 0.70,
            "low_similarity": 0.55,
            "minimum_similarity": 0.40
        }
        
        # Synapse type indicators
        self.synapse_patterns = {
            SynapseType.BUILDING: {
                "keywords": ["building on", "expanding", "adding to", "furthermore", "additionally", "moreover"],
                "patterns": [r"as \w+ mentioned", r"following up on", r"to add to"],
                "weight": 0.8
            },
            SynapseType.SYNTHESIS: {
                "keywords": ["combining", "synthesizing", "bringing together", "integrating", "merging"],
                "patterns": [r"taking both .* and", r"synthesis of", r"integrated approach"],
                "weight": 0.9
            },
            SynapseType.REINFORCEMENT: {
                "keywords": ["agree", "absolutely", "exactly", "reinforcing", "supporting", "confirm"],
                "patterns": [r"I (?:strongly )?agree", r"exactly right", r"spot on"],
                "weight": 0.7
            },
            SynapseType.CLARIFICATION: {
                "keywords": ["clarifying", "specifically", "precisely", "to be clear", "in other words"],
                "patterns": [r"to clarify", r"more specifically", r"what I mean is"],
                "weight": 0.6
            }
        }    
    def detect_synapse(self, new_message: Message, recent_messages: List[Message]) -> Optional[Tuple[SynapseType, float, str]]:
        """
        Detect synapses using semantic analysis
        Returns: (synapse_type, confidence, building_on_message_id) or None
        """
        if not recent_messages:
            return None
            
        # First try semantic analysis if available
        if self.enabled and self.model:
            semantic_result = self._semantic_analysis(new_message, recent_messages)
            if semantic_result:
                return semantic_result
        
        # Fallback to enhanced keyword detection
        return self._enhanced_keyword_detection(new_message, recent_messages)
    
    def _semantic_analysis(self, new_message: Message, recent_messages: List[Message]) -> Optional[Tuple[SynapseType, float, str]]:
        """Perform semantic similarity analysis between messages"""
        try:
            # Encode the new message
            new_embedding = self.model.encode(new_message.content)
            
            # Encode recent messages and calculate similarities
            best_match = None
            highest_similarity = 0
            
            for prev_msg in recent_messages[-10:]:  # Look at last 10 messages
                if prev_msg.id == new_message.id or not prev_msg.model_source:
                    continue
                    
                prev_embedding = self.model.encode(prev_msg.content)
                similarity = cosine_similarity([new_embedding], [prev_embedding])[0][0]                
                if similarity > highest_similarity and similarity >= self.thresholds["minimum_similarity"]:
                    highest_similarity = similarity
                    best_match = prev_msg
                    
            if not best_match:
                return None
                
            # Determine synapse type based on similarity and content analysis
            synapse_type, confidence = self._classify_synapse_type(
                new_message.content, 
                best_match.content, 
                highest_similarity
            )
            
            if confidence > 0.5:  # Confidence threshold
                return synapse_type, confidence, best_match.id
                
        except Exception as e:
            logger.error(f"Error in semantic analysis: {e}")
            
        return None    
    def _classify_synapse_type(self, new_content: str, prev_content: str, similarity: float) -> Tuple[SynapseType, float]:
        """Classify the type of synapse based on content and similarity"""
        new_lower = new_content.lower()
        scores = {}
        
        # Check each synapse type's patterns
        for synapse_type, patterns in self.synapse_patterns.items():
            score = 0.0
            evidence = []
            
            # Check keywords
            for keyword in patterns["keywords"]:
                if keyword in new_lower:
                    score += 0.3
                    evidence.append(f"keyword: {keyword}")
                    
            # Check regex patterns
            for pattern in patterns["patterns"]:
                if re.search(pattern, new_lower):
                    score += 0.4
                    evidence.append(f"pattern: {pattern}")
                    
            # Factor in semantic similarity
            if similarity >= self.thresholds["high_similarity"]:
                score += 0.3
            elif similarity >= self.thresholds["medium_similarity"]:
                score += 0.2
            elif similarity >= self.thresholds["low_similarity"]:
                score += 0.1
                
            # Apply type-specific weight
            score *= patterns["weight"]
            scores[synapse_type] = (score, evidence)
            
        # Get the highest scoring type
        if scores:
            best_type = max(scores.keys(), key=lambda k: scores[k][0])
            best_score, evidence = scores[best_type]
            
            if best_score > 0:
                logger.debug(f"Classified as {best_type} with score {best_score:.2f}. Evidence: {evidence}")
                return best_type, min(best_score, 1.0)
                
        # Default to building if high similarity but no specific pattern
        if similarity >= self.thresholds["medium_similarity"]:
            return SynapseType.BUILDING, similarity * 0.7
            
        return SynapseType.BUILDING, 0.0    
    def _enhanced_keyword_detection(self, new_message: Message, recent_messages: List[Message]) -> Optional[Tuple[SynapseType, float, str]]:
        """Enhanced keyword-based detection as fallback"""
        new_lower = new_message.content.lower()
        best_match = None
        best_score = 0
        best_type = None
        
        for prev_msg in recent_messages[-10:]:
            if prev_msg.id == new_message.id or not prev_msg.model_source:
                continue
                
            # Check for each synapse type
            for synapse_type, patterns in self.synapse_patterns.items():
                score = 0
                
                # Check keywords
                keyword_matches = sum(1 for kw in patterns["keywords"] if kw in new_lower)
                score += keyword_matches * 0.3
                
                # Check patterns
                pattern_matches = sum(1 for p in patterns["patterns"] if re.search(p, new_lower))
                score += pattern_matches * 0.4
                
                # Check term overlap
                prev_terms = set(prev_msg.content.lower().split())
                new_terms = set(new_lower.split())
                overlap = len(prev_terms & new_terms) / max(len(prev_terms), len(new_terms), 1)
                score += overlap * 0.3
                
                # Apply weight
                score *= patterns["weight"]
                
                if score > best_score:
                    best_score = score
                    best_match = prev_msg
                    best_type = synapse_type
                    
        if best_score > 0.3:  # Minimum threshold
            return best_type, min(best_score, 1.0), best_match.id
            
        return None
    
    def update_thresholds(self, thresholds: Dict[str, float]):
        """Update similarity thresholds for fine-tuning"""
        self.thresholds.update(thresholds)
        logger.info(f"Updated semantic thresholds: {self.thresholds}")

# Singleton instance
semantic_detector = SemanticSynapseDetector()