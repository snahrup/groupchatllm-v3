"""
Database Models for User Personas
Supports persistent storage of custom AI personas
"""

from sqlalchemy import Column, String, JSON, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class UserPersona(Base):
    """Store user-created AI personas"""
    __tablename__ = 'user_personas'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)  # User who created this
    name = Column(String, nullable=False)  # User-friendly name
    
    # Persona configuration
    provider = Column(String, nullable=False)  # openai, anthropic, google
    model_name = Column(String, nullable=False)  # Actual model identifier
    role = Column(String, nullable=False)
    icon = Column(String, nullable=False)
    prompt_prefix = Column(Text, nullable=False)
    collaboration_style = Column(String, nullable=False)
    color_theme = Column(String, nullable=False)    
    # Additional custom settings
    custom_settings = Column(JSON, default={})  # For future extensibility
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = Column(Boolean, default=False)  # Can other users see/use this?
    is_active = Column(Boolean, default=True)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "provider": self.provider,
            "model_name": self.model_name,
            "role": self.role,
            "icon": self.icon,
            "prompt_prefix": self.prompt_prefix,
            "collaboration_style": self.collaboration_style,
            "color_theme": self.color_theme,
            "custom_settings": self.custom_settings,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_public": self.is_public,
            "is_active": self.is_active
        }