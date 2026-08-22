import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/api/api_client.dart';

class CustomerSettingsScreen extends StatefulWidget {
  const CustomerSettingsScreen({super.key});

  @override
  State<CustomerSettingsScreen> createState() => _CustomerSettingsScreenState();
}

class _CustomerSettingsScreenState extends State<CustomerSettingsScreen> {
  static const int _maxAvatarBytes = 500 * 1024;

  XFile? _avatar;
  Uint8List? _avatarBytes;
  bool _saving = false;

  Future<void> _changeAvatar() async {
    XFile? selected;
    try {
      selected = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 800,
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open photo gallery: $error')),
        );
      }
      return;
    }
    if (selected == null || !mounted) return;
    final bytes = await selected.readAsBytes();
    if (bytes.length > _maxAvatarBytes) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile picture must be 500KB or smaller.'),
          ),
        );
      }
      return;
    }

    setState(() {
      _avatar = selected;
      _avatarBytes = bytes;
      _saving = true;
    });
    unawaited(_uploadAvatarInBackground(selected, bytes));
  }

  Future<void> _uploadAvatarInBackground(
    XFile selected,
    Uint8List bytes,
  ) async {
    try {
      final user = ApiClient.currentUser ?? const <String, dynamic>{};
      final name = (user['name'] ?? user['full_name'] ?? '').toString().trim();
      final email = (user['email'] ?? '').toString().trim();

      if (name.isEmpty || email.isEmpty) {
        throw const ApiException(
          'Missing profile name/email. Please update account details first.',
        );
      }

      final response = await ApiClient.postMultipart(
        '/me/profile',
        {'name': name, 'email': email},
        fileBytes: bytes,
        fileName: selected.name,
      );
      if (response is Map && response['user'] is Map) {
        ApiClient.currentUser = Map<String, dynamic>.from(response['user']);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile picture updated.')),
        );
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _avatar = null;
          _avatarBytes = null;
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  String _readCurrentName() {
    final user = ApiClient.currentUser ?? const {};
    final name = user['name'] ?? user['full_name'];
    if (name != null && name.toString().trim().isNotEmpty) {
      return name.toString();
    }
    return 'Customer';
  }

  String _readCurrentEmail() {
    final user = ApiClient.currentUser ?? const {};
    final email = user['email'];
    if (email != null && email.toString().trim().isNotEmpty) {
      return email.toString();
    }
    return 'No email provided';
  }

  @override
  Widget build(BuildContext context) {
    final avatarUrl = (ApiClient.currentUser ?? const {})['avatar_url']
        ?.toString();
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: const Color(0xFFF5F7FA),
        foregroundColor: const Color(0xFF0B1023),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: GestureDetector(
                    onTap: _saving ? null : _changeAvatar,
                    child: CircleAvatar(
                      radius: 44,
                      backgroundColor: const Color(0xFFEAF2FF),
                      backgroundImage: _avatar != null
                          ? MemoryImage(_avatarBytes!)
                          : (avatarUrl == null || avatarUrl.isEmpty
                                ? null
                                : NetworkImage(avatarUrl)),
                      child:
                          _avatar == null &&
                              (avatarUrl == null || avatarUrl.isEmpty)
                          ? const Icon(Icons.add_a_photo_outlined, size: 28)
                          : null,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: TextButton(
                    onPressed: _saving ? null : _changeAvatar,
                    child: Text(
                      _saving ? 'Uploading...' : 'Change profile picture',
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Account details',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                Text(
                  _readCurrentName(),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  _readCurrentEmail(),
                  style: const TextStyle(color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _SettingsListTile(
            icon: Icons.notifications_none_rounded,
            title: 'Notifications',
            subtitle: 'Manage order and promotion alerts',
          ),
          const SizedBox(height: 12),
          _SettingsListTile(
            icon: Icons.lock_outline_rounded,
            title: 'Privacy & security',
            subtitle: 'Control account and privacy options',
          ),
          const SizedBox(height: 12),
          _SettingsListTile(
            icon: Icons.help_outline_rounded,
            title: 'Help center',
            subtitle: 'Read FAQs and get support',
          ),
        ],
      ),
    );
  }
}

class _SettingsListTile extends StatelessWidget {
  const _SettingsListTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: const Color(0xFFEAF2FF),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: const Color(0xFF1849B7)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
