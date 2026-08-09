import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Profile, Project, Thought, ContactMessage, GuestbookEntry, Skill } from '../types';
import { Shield, Lock, Save, Plus, Trash2, Download, ShieldAlert, Check, AlertTriangle, Upload } from 'lucide-react';
import { hashPasscode, sanitizeInput } from '../lib/crypto';
import { uploadImage } from '../lib/imageUpload';

interface AdminModalProps {
  profile: Profile | null;
  projects: Project[];
  thoughts: Thought[];
  skills: 
