from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class EmailAnalyzeRequest(BaseModel):
    raw: str = Field(..., description="Raw RFC 822 email text")

class IPLookupRequest(BaseModel):
    ip: str = Field(..., description="IP address to lookup")

class IPBatchLookupRequest(BaseModel):
    ips: List[str] = Field(..., description="List of IP addresses to lookup")

class CreateCaseRequest(BaseModel):
    name: str = Field(..., description="Case name / title")
    emails: Optional[List[str]] = Field(default=[], description="List of analyzed email IDs")
    notes: Optional[str] = Field(default="", description="Case notes / description")
    tags: Optional[List[str]] = Field(default=[], description="Tags for categorization")

class UpdateCaseRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    emails: Optional[List[str]] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class AddEmailToCaseRequest(BaseModel):
    emailId: str = Field(..., description="Email ID to add to case")

class InboxConnectRequest(BaseModel):
    email: str = Field(..., description="User's email address")
    password: str = Field(..., description="App password or email password")
    imapServer: Optional[str] = Field(default=None, description="IMAP server hostname (auto-detected if omitted)")
    maxEmails: Optional[int] = Field(default=30, description="Maximum number of emails to fetch (1-50)", ge=1, le=50)

# Auth Models
class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="Plaintext password")

class RegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="Password (min 6 chars)")
    name: str = Field(..., description="Full name")
    role: Optional[str] = Field(default="Viewer", description="Assigned role")

class UserCreateRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="Initial password")
    name: str = Field(..., description="Full name")
    role: str = Field(default="Security Analyst", description="Role: Super Admin, Security Analyst, Investigator, Viewer")
    status: Optional[str] = Field(default="active", description="Account status: active, suspended, inactive")

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class PasswordResetRequest(BaseModel):
    newPassword: str = Field(..., description="New password")

class PasswordChangeRequest(BaseModel):
    currentPassword: str = Field(..., description="Current password")
    newPassword: str = Field(..., description="New password")

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None

class SettingsUpdateRequest(BaseModel):
    theme: Optional[str] = Field(default="dark", description="Theme: light or dark")
    notificationsEmail: Optional[bool] = True
    notificationsBrowser: Optional[bool] = True
    autoRefreshInterval: Optional[int] = 30
    compactView: Optional[bool] = False

class NotificationCreateRequest(BaseModel):
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message")
    type: Optional[str] = Field(default="info", description="Notification type: info, warning, threat, success")
    link: Optional[str] = Field(default=None, description="Optional navigation link")

class DomainLookupRequest(BaseModel):
    domain: str = Field(..., description="Domain name to investigate, e.g. paypal-security.com")

class UrlAnalyzeRequest(BaseModel):
    url: str = Field(..., description="Full URL to analyze")

