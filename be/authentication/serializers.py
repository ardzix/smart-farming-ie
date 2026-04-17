from rest_framework import serializers
from .models import CustomUser, Profile, Role
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['phone', 'address', 'website']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    role = RoleSerializer(read_only=True)
    
    # Field Write-Only untuk input
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), 
        source='role', 
        write_only=True,
        required=False
    )
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_id', 'profile',
            'phone', 'address', 'password'
        )
        read_only_fields = ('id',)
    
    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        password = validated_data.pop('password', None)
        
        user = super().create(validated_data)
        
        if password:
            user.set_password(password)
            user.save()
            
        # Update profile
        if hasattr(user, 'profile'):
            user.profile.phone = phone
            user.profile.address = address
            user.profile.save()
            
        return user

    def update(self, instance, validated_data):
        phone = validated_data.pop('phone', None)
        address = validated_data.pop('address', None)
        password = validated_data.pop('password', None)
        
        instance = super().update(instance, validated_data)
        
        if password:
            instance.set_password(password)
            instance.save()
        
        if phone is not None:
            instance.profile.phone = phone
        if address is not None:
            instance.profile.address = address
        instance.profile.save()
        
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=CustomUser.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        # Default role: Viewer
        default_role, _ = Role.objects.get_or_create(name='Viewer')
        
        user = CustomUser.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            role=default_role
        )
        user.set_password(validated_data['password'])
        user.save()
        return user