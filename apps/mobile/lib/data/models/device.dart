/// Matches `Device` in `apps/web/src/lib/types.ts`.
class Device {
  const Device({
    required this.id,
    required this.name,
    required this.location,
    required this.soilType,
    required this.cropType,
    required this.status,
    required this.ownerId,
  });

  final String id;
  final String name;
  final String location;
  final String soilType;
  final String cropType;
  final String status;
  final String ownerId;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'location': location,
        'soilType': soilType,
        'cropType': cropType,
        'status': status,
        'ownerId': ownerId,
      };

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      soilType: json['soilType']?.toString() ?? '',
      cropType: json['cropType']?.toString() ?? '',
      status: json['status']?.toString() ?? 'ONLINE',
      ownerId: json['ownerId']?.toString() ?? '',
    );
  }
}
